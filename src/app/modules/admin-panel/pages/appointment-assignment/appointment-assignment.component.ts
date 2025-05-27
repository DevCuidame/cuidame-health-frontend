import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  Appointment,
  appointmentCounts,
} from 'src/app/core/interfaces/appointment.interface';
import { PendingCardComponent } from '../../components/pending-card/pending-card.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { AppointmentWebSocketService } from 'src/app/core/services/appointment/appointment-websocket.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointment-assignment',
  imports: [PendingCardComponent, FontAwesomeModule, SearchBarComponent, CommonModule],
  templateUrl: './appointment-assignment.component.html',
  styleUrls: ['./appointment-assignment.component.scss'],
})
export class AppointmentAssignmentComponent implements OnInit, OnDestroy {
  public appointments: Appointment[] = [];
  public appointmentCounts: appointmentCounts = {
    EXPIRED: 0,
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    RESCHEDULED: 0,
    COMPLETED: 0,
  };
  public requests: string = '0 solicitudes';
  public isConnected: boolean = false;
  public connectionError: string | null = null;
  public isLoading: boolean = true;
  private checkConnectionTimeout?: any;

  private destroy$ = new Subject<void>();

  constructor(
    private appointmentWebSocketService: AppointmentWebSocketService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.initializeWebSocketConnection();
    
    // Aumentar el timeout y verificar si ya hay conexión
    this.checkConnectionTimeout = setTimeout(() => {
      if (!this.isConnected && this.appointments.length === 0 && !this.isLoading) {
        this.isLoading = false;
      }
    }, 5000); // Reducir a 5 segundos
  }

  /**
   * Configurar suscripciones a observables con proper cleanup
   */
  private setupSubscriptions(): void {
    // Suscribirse a appointments
    this.appointmentWebSocketService.appointments$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments: Appointment[]) => {
          this.appointments = appointments;
          this.isLoading = false;
          console.log('📊 Appointments actualizadas:', appointments.length);
        },
        error: (error) => {
          console.error('Error en appointments$:', error);
          this.isLoading = false;
        }
      });

    // Suscribirse a contadores
    this.appointmentWebSocketService.appointmentCounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counts: appointmentCounts) => {
          this.appointmentCounts = counts;
          this.updateRequestsText();
          console.log('🔢 Contadores actualizados:', counts);
        },
        error: (error) => {
          console.error('Error en appointmentCounts$:', error);
        }
      });

    // Suscribirse a estado de conexión
    this.appointmentWebSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (connected: boolean) => {
          this.isConnected = connected;
          console.log(`🔌 Estado de conexión: ${connected ? 'Conectado' : 'Desconectado'}`);
          
          if (connected) {
            this.connectionError = null;
            // Si se reconectó y no hay datos, solicitar appointments
            if (this.appointments.length === 0) {
              setTimeout(() => this.refreshAppointments(), 1000);
            }
          }
        },
        error: (error) => {
          console.error('Error en connectionStatus$:', error);
        }
      });

    // Suscribirse a errores
    this.appointmentWebSocketService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (error: string) => {
          this.connectionError = error;
          this.isLoading = false;
          console.error('❌ Error WebSocket:', error);
        },
        error: (error) => {
          console.error('Error en error$:', error);
        }
      });
  }

  /**
   * Inicializar conexión WebSocket
   */
  private initializeWebSocketConnection(): void {
    try {
      this.appointmentWebSocketService.connect();
    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
      this.connectionError = 'Error al inicializar la conexión';
      this.isLoading = false;
    }
  }

  /**
   * Actualizar texto de solicitudes
   */
  private updateRequestsText(): void {
    const pendingCount = this.appointmentCounts.PENDING;
    this.requests = pendingCount > 0
      ? `${pendingCount} solicitud${pendingCount !== 1 ? 'es' : ''}`
      : '0 solicitudes';
  }

  /**
   * Solicitar actualización manual de appointments
   */
  public refreshAppointments(): void {
    console.log('🔄 Solicitando actualización manual de appointments');
    
    if (this.isConnected) {
      this.appointmentWebSocketService.requestAllAppointments();
    } else {
      console.log('🔄 No conectado, intentando reconectar...');
      this.isLoading = true;
      this.reconnect();
    }
  }

  /**
   * Reconectar WebSocket manualmente
   */
  public reconnect(): void {
    console.log('🔄 Reconectando manualmente...');
    this.isLoading = true;
    this.connectionError = null;
    
    this.appointmentWebSocketService.disconnect();
    
    setTimeout(() => {
      this.appointmentWebSocketService.connect();
    }, 1000);
  }


  /**
   * Calcular contadores desde los datos actuales
   */
  private updateAppointmentCountsFromData(): void {
    const counts: appointmentCounts = {
      EXPIRED: 0,
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      RESCHEDULED: 0,
      COMPLETED: 0,

    };

    this.appointments.forEach(appointment => {
      const status = appointment.status as keyof appointmentCounts;
      if (status && counts[status] !== undefined) {
        counts[status]++;
      }
    });

    this.appointmentCounts = counts;
  }

  /**
   * Obtener estado de conexión para la UI
   */
  public getConnectionStatus(): string {
    if (this.isLoading) {
      return 'Conectando...';
    } else if (this.isConnected) {
      return 'Conectado';
    } else if (this.connectionError) {
      return `Error: ${this.connectionError}`;
    } else {
      return 'Desconectado';
    }
  }

  /**
   * Obtener clase CSS para el estado de conexión
   */
  public getConnectionStatusClass(): string {
    if (this.isLoading) {
      return 'status-connecting';
    } else if (this.isConnected) {
      return 'status-connected';
    } else {
      return 'status-disconnected';
    }
  }

  /**
   * Verificar si hay appointments disponibles
   */
  public hasAppointments(): boolean {
    return this.appointments.length > 0;
  }

  /**
   * Obtener appointments filtradas por estado
   */
  public getAppointmentsByStatus(status: string): Appointment[] {
    return this.appointments.filter(appointment => appointment.status === status);
  }

  /**
   * Verificar si se están cargando datos
   */
  public isLoadingData(): boolean {
    return this.isLoading;
  }

  /**
   * Manejar retry de conexión desde UI
   */
  public onRetryConnection(): void {
    this.reconnect();
  }

  ngOnDestroy(): void {
    console.log('🧹 Destruyendo AppointmentAssignmentComponent...');
    
    // Limpiar el timeout si existe
    if (this.checkConnectionTimeout) {
      clearTimeout(this.checkConnectionTimeout);
    }
    
    // Completar el subject de destroy para cancelar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    
    // Desconectar WebSocket
    try {
      this.appointmentWebSocketService.disconnect();
    } catch (error) {
      console.error('Error desconectando WebSocket:', error);
    }
    
    console.log('✅ Componente AppointmentAssignment destruido y limpiado');
  }
}