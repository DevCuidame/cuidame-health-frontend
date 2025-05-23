import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
import {
  Appointment,
  appointmentCounts,
} from 'src/app/core/interfaces/appointment.interface';
import {
  takeUntil,
  switchMap,
  catchError,
  tap,
  finalize,
} from 'rxjs/operators';
import { EMPTY } from 'rxjs';

export interface AppointmentWebSocketMessage {
  type:
    | 'connection'
    | 'appointmentsList'
    | 'newAppointment'
    | 'appointmentUpdated'
    | 'error'
    | 'ping'
    | 'pong'
    | 'fetchAllAppointments';
  appointments?: Appointment[];
  appointment?: Appointment;
  message?: string;
  clientId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentWebSocketService {
  private wsUrl = `${environment.wsUrl}/appointments`;
  private socket$: WebSocketSubject<AppointmentWebSocketMessage> | null = null;

  // Subjects para el estado
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  private appointmentCountsSubject = new BehaviorSubject<appointmentCounts>({
    EXPIRED: 0,
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    RESCHEDULED: 0,
  });
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<string>();

  // Control de reconexión y estado
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;
  private isConnecting = false;
  private shouldReconnect = true;
  private destroy$ = new Subject<void>();
  private reconnectTimer$ = new Subject<void>();

  // Observables públicos
  appointments$ = this.appointmentsSubject.asObservable();
  appointmentCounts$ = this.appointmentCountsSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor() {}

  /**
   * Conectar al WebSocket de appointments
   */
  connect(): void {
    // Remover la verificación redundante del inicio
    if (this.socket$ && !this.socket$.closed && this.connectionStatusSubject.value) {
      console.log('🔄 WebSocket ya está conectado y activo');
      return;
    }
  
    if (this.isConnecting) {
      console.log('🔄 WebSocket ya está intentando conectar');
      return;
    }
  
    this.isConnecting = true;
    this.shouldReconnect = true;
    this.reconnectTimer$.next(); // Cancel any pending reconnection
  
    console.log('🔗 Conectando a WebSocket de appointments:', this.wsUrl);
  
    // Cerrar conexión existente si existe
    this.closeSocket();
  
    try {
      this.socket$ = webSocket<AppointmentWebSocketMessage>({
        url: this.wsUrl,
        openObserver: {
          next: () => {
            console.log('✅ WebSocket de appointments conectado');
            this.connectionStatusSubject.next(true);
            this.reconnectionAttempts = 0;
            this.isConnecting = false;
  
            // Solicitar todas las appointments al conectar
            setTimeout(() => this.requestAllAppointments(), 500);
            
            // Iniciar heartbeat
            this.startHeartbeat();
          },
        },
        closeObserver: {
          next: (event) => {
            console.log(
              '❌ WebSocket de appointments cerrado:',
              event.code,
              event.reason
            );
            this.connectionStatusSubject.next(false);
            this.isConnecting = false;
            this.stopHeartbeat();
  
            // Solo reconectar si no fue un cierre intencional y shouldReconnect es true
            if (
              this.shouldReconnect &&
              event.code !== 1000 &&
              event.code !== 1001
            ) {
              this.scheduleReconnection();
            }
          },
        },
      });
  
      // Suscribirse a mensajes con manejo de errores robusto
      this.socket$
        .pipe(
          takeUntil(this.destroy$),
          tap((message) => this.handleMessage(message)),
          catchError((error) => {
            console.error('Error en WebSocket de appointments:', error);
            this.connectionStatusSubject.next(false);
            this.isConnecting = false;
            this.stopHeartbeat();
            this.handleSocketError(error);
            return EMPTY;
          }),
          finalize(() => {
            console.log('🔌 WebSocket stream finalizado');
            this.isConnecting = false;
            this.stopHeartbeat();
          })
        )
        .subscribe();
    } catch (error) {
      console.error('Error creando WebSocket:', error);
      this.isConnecting = false;
      this.connectionStatusSubject.next(false);
      this.handleSocketError(error);
    }
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    console.log('🔌 Desconectando WebSocket...');
    this.shouldReconnect = false;
    this.reconnectTimer$.next(); // Cancel any pending reconnection
    this.stopHeartbeat(); // ✅ NUEVO: Parar heartbeat
    this.closeSocket();
    this.connectionStatusSubject.next(false);
    this.isConnecting = false;
    this.reconnectionAttempts = 0;
  }

  /**
   * Cerrar socket actual
   */
  private closeSocket(): void {
    if (this.socket$) {
      try {
        // Verificar si el socket está realmente abierto antes de cerrarlo
        if (!this.socket$.closed) {
          this.socket$.complete();
        }
      } catch (error) {
        console.warn('Error cerrando socket:', error);
      }
      this.socket$ = null;
    }
    // Asegurar que el estado se resetea
    this.isConnecting = false;
  }

  /**
   * Los timers pueden acumularse causando memory leaks
   */
  private scheduleReconnection(): void {
    if (!this.shouldReconnect || this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        console.error('❌ Máximo de intentos de reconexión alcanzado');
        this.errorSubject.next('No se pudo restablecer la conexión con el servidor');
      }
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.reconnectionAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectionAttempts) * 1000, 30000);

    console.log(
      `🔄 Programando reconexión (${this.reconnectionAttempts}/${this.maxReconnectionAttempts}) en ${delay}ms...`
    );

    // ✅ SOLUCIÓN: Cancelar timer anterior antes de crear uno nuevo
    this.reconnectTimer$.next(); // Cancela timer anterior

    timer(delay)
      .pipe(
        takeUntil(this.reconnectTimer$),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.shouldReconnect && !this.isConnecting && !this.connectionStatusSubject.value) {
          console.log('🔄 Intentando reconectar...');
          this.connect();
        }
      });
  }

  /**
   * Solicitar todas las appointments
   */
  private lastRequestTime = 0;
  private readonly REQUEST_THROTTLE_MS = 1000; // 1 segundo

  requestAllAppointments(): void {
    const now = Date.now();
    
    // ✅ SOLUCIÓN: Throttling de requests
    if (now - this.lastRequestTime < this.REQUEST_THROTTLE_MS) {
      console.log('⚠️ Request throttled - demasiado frecuente');
      return;
    }

    if (this.socket$ && !this.socket$.closed && this.connectionStatusSubject.value) {
      console.log('📤 Solicitando todas las appointments');
      try {
        this.socket$.next({
          type: 'fetchAllAppointments'
        });
        this.lastRequestTime = now;
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        this.handleSocketError(error);
      }
    } else {
      console.warn('⚠️ No se puede solicitar appointments - WebSocket no conectado');
      if (this.shouldReconnect) {
        this.connect();
      }
    }
  }

  /**
   * Manejar mensajes del WebSocket
   */
  private handleMessage(message: AppointmentWebSocketMessage): void {
    console.log('📥 Mensaje recibido:', message);

    try {
      switch (message.type) {
        case 'connection':
          console.log('Conexión confirmada:', message.message);
          break;

        case 'appointmentsList':
          if (message.appointments) {
            this.updateAppointments(message.appointments);
          }
          break;

        case 'newAppointment':
          if (message.appointment) {
            this.addAppointment(message.appointment);
          }
          break;

        case 'appointmentUpdated':
          if (message.appointment) {
            this.updateAppointment(message.appointment);
          }
          break;

        case 'error':
          console.error('Error del servidor:', message.message);
          this.errorSubject.next(message.message || 'Error desconocido');
          break;

        case 'pong':
          // Respuesta al ping - conexión activa
          console.debug('📡 Pong recibido - conexión activa');
          break;

        default:
          console.warn('Tipo de mensaje desconocido:', message.type);
      }
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    }
  }

  /**
   * Actualizar lista completa de appointments
   */
  private updateAppointments(appointments: Appointment[]): void {
    this.appointmentsSubject.next(appointments);
    this.updateCounts(appointments);
    console.log(`📊 ${appointments.length} appointments actualizadas`);
  }

  /**
   * Agregar nueva appointment
   */
  private addAppointment(appointment: Appointment): void {
    const currentAppointments = this.appointmentsSubject.value;
    const updatedAppointments = [...currentAppointments, appointment];
    this.appointmentsSubject.next(updatedAppointments);
    this.updateCounts(updatedAppointments);
    console.log('➕ Nueva appointment agregada:', appointment.id);
  }

  /**
   * Actualizar appointment existente
   */
  private updateAppointment(updatedAppointment: Appointment): void {
    const currentAppointments = this.appointmentsSubject.value;
    const updatedAppointments = currentAppointments.map((appointment) =>
      appointment.id === updatedAppointment.id
        ? updatedAppointment
        : appointment
    );
    this.appointmentsSubject.next(updatedAppointments);
    this.updateCounts(updatedAppointments);
    console.log('🔄 Appointment actualizada:', updatedAppointment.id);
  }

  /**
   * Actualizar contadores de appointments
   */
  private updateCounts(appointments: Appointment[]): void {
    const counts: appointmentCounts = {
      EXPIRED: 0,
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      RESCHEDULED: 0,
    };

    appointments.forEach((appointment) => {
      const status = appointment.status as keyof appointmentCounts;
      if (status && counts[status] !== undefined) {
        counts[status]++;
      }
    });

    this.appointmentCountsSubject.next(counts);
  }

  /**
   * Manejar errores del WebSocket
   */
  private handleSocketError(error: any): void {
    console.error('Error en WebSocket:', error);
    
    // ✅ SOLUCIÓN: Información más detallada del error
    let errorMessage = 'Error de conexión con el servidor';
    
    if (error instanceof Event) {
      // Error de conexión WebSocket
      errorMessage = 'No se pudo conectar al servidor WebSocket';
    } else if (error.code) {
      // Error con código específico
      errorMessage = `Error WebSocket ${error.code}: ${error.reason || 'Conexión fallida'}`;
    }
    
    this.errorSubject.next(errorMessage);
    
    if (this.shouldReconnect) {
      this.scheduleReconnection();
    }
  }

  /**
   * Obtener estado actual de appointments
   */
  getCurrentAppointments(): Appointment[] {
    return this.appointmentsSubject.value;
  }

  /**
   * Obtener estado actual de contadores
   */
  getCurrentCounts(): appointmentCounts {
    return this.appointmentCountsSubject.value;
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.connectionStatusSubject.value;
  }

  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 segundos

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Limpiar cualquier heartbeat anterior
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket$ && !this.socket$.closed && this.connectionStatusSubject.value) {
        try {
          this.socket$.next({ type: 'ping' });
        } catch (error) {
          console.error('Error enviando ping:', error);
          this.handleSocketError(error);
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  destroy(): void {
    console.log('🧹 Destruyendo AppointmentWebSocketService');
    this.stopHeartbeat();
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  /**
   * Limpiar recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    console.log('🧹 Destruyendo AppointmentWebSocketService');
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
