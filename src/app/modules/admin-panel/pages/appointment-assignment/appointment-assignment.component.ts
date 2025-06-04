import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { filter, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  Appointment,
  appointmentCounts,
} from 'src/app/core/interfaces/appointment.interface';
import { PendingCardComponent } from '../../components/pending-card/pending-card.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { AppointmentWebSocketService } from 'src/app/core/services/appointment/appointment-websocket.service';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointment-assignment',
  imports: [
    PendingCardComponent,
    FontAwesomeModule,
    SearchBarComponent,
    CommonModule,
  ],
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
  public filteredAppointments: Appointment[] = [];
  public connectionError: string | null = null;
  public isLoading: boolean = true;
  public isSearching: boolean = false;
  public currentSearchTerm: string = '';
  public currentFilters: any = {};
  private checkConnectionTimeout?: any;

  private destroy$ = new Subject<void>();
  private readonly VALID_STATUSES = ['requested', 'confirmed', 'rescheduled'];
  private readonly MANAGEABLE_STATUSES = ['requested', 'confirmed', 'rescheduled'];

  constructor(
    private appointmentWebSocketService: AppointmentWebSocketService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.initializeWebSocketConnection();

    // Aumentar el timeout y verificar si ya hay conexión
    this.checkConnectionTimeout = setTimeout(() => {
      if (
        !this.isConnected &&
        this.appointments.length === 0 &&
        !this.isLoading
      ) {
        this.isLoading = false;
      }
    }, 5000); // Reducir a 5 segundos
  }

  /**
   * Configurar suscripciones a observables con proper cleanup
   */
  private setupSubscriptions(): void {
    // Suscripción a appointments con filtrado
    this.appointmentWebSocketService.appointments$
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (appointments) => appointments !== null && appointments !== undefined
        )
      )
      .subscribe({
        next: (appointments: Appointment[]) => {
          this.appointments = appointments;
          this.filterAppointments();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al recibir appointments:', error);
          this.isLoading = false;
          this.connectionError = 'Error al cargar las citas';
        },
      });

    // Suscripción a contadores
    this.appointmentWebSocketService.appointmentCounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counts: appointmentCounts) => {
          this.appointmentCounts = counts;
          this.updateRequestsText();
        },
      });

    // Estado de conexión
    this.appointmentWebSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (connected: boolean) => {
          this.isConnected = connected;

          if (connected) {
            this.connectionError = null;
            if (this.appointments.length === 0) {
              this.refreshAppointments();
            }
          }
        },
      });

    // Manejo de errores
    this.appointmentWebSocketService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (error: string) => {
          this.connectionError = error;
          this.isLoading = false;
        },
      });
  }

  private filterAppointments(): void {
    // Si hay búsqueda activa, no filtrar localmente
    if (this.currentSearchTerm || Object.keys(this.currentFilters).some(key => this.currentFilters[key])) {
      return;
    }
    
    // Filtrar solo citas con estados válidos para gestión y datos completos
    this.filteredAppointments = this.appointments.filter(
      (appointment) => this.isValidAppointmentForManagement(appointment)
    );
  }

  /**
   * Validar si una cita es válida para gestión en el admin panel
   */
  private isValidAppointmentForManagement(appointment: Appointment): boolean {
    // Verificar estado válido
    if (!this.MANAGEABLE_STATUSES.includes(appointment.status)) {
      return false;
    }

    // Verificar datos mínimos del paciente
    if (!appointment.patient || 
        !appointment.patient.nombre || 
        !appointment.patient.tipoid || 
        !appointment.patient.numeroid) {
      return false;
    }

    // Verificar que tenga especialidad
    if (!appointment.specialty || !appointment.specialty_id) {
      return false;
    }

    // Verificar que tenga ID válido
    if (!appointment.id || appointment.id <= 0) {
      return false;
    }

    return true;
  }

  private updateRequestsText(): void {
    const requestedCount = this.appointments.filter(
      (a) => a.status === 'requested'
    ).length;
    this.requests =
      requestedCount > 0
        ? `${requestedCount} solicitud${requestedCount !== 1 ? 'es' : ''}`
        : '0 solicitudes';
  }

  private initializeWebSocketConnection(): void {
    try {
      this.appointmentWebSocketService.connect();
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.connectionError = 'No se pudo establecer conexión con el servidor';
      this.isLoading = false;
    }
  }

  public refreshAppointments(): void {
    if (this.isConnected) {
      this.appointmentWebSocketService.requestAllAppointments();
    } else {
      this.initializeWebSocketConnection();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.appointmentWebSocketService.disconnect();
  }

  /**
   * Maneja los cambios en el término de búsqueda
   */
  onSearchChange(searchTerm: string): void {
    this.currentSearchTerm = searchTerm;
    this.performSearch();
  }

  /**
   * Maneja los cambios en los filtros
   */
  onFilterChange(filters: any): void {
    this.currentFilters = filters;
    this.performSearch();
  }

  /**
   * Realiza la búsqueda en el backend
   */
  private performSearch(): void {
    // Si no hay término de búsqueda ni filtros, mostrar todas las citas locales
    if (!this.currentSearchTerm && !Object.keys(this.currentFilters).some(key => this.currentFilters[key])) {
      this.filterAppointments();
      return;
    }

    this.isSearching = true;
    
    // Preparar filtros para el backend
    const backendFilters: any = {};
    
    if (this.currentFilters.status) {
      backendFilters.status = this.currentFilters.status;
    }
    
    if (this.currentFilters.specialty) {
      backendFilters.specialty = this.currentFilters.specialty;
    }

    // Realizar búsqueda en el backend
    this.appointmentService.searchAppointments(this.currentSearchTerm, backendFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSearching = false;
          if (response && response.data) {
            // Filtrar los resultados para mostrar solo los válidos para gestión
            this.filteredAppointments = response.data.filter(
              (appointment) => this.isValidAppointmentForManagement(appointment)
            );
          } else {
            this.filteredAppointments = [];
          }
        },
        error: (error) => {
          this.isSearching = false;
          console.error('Error en la búsqueda:', error);
          this.connectionError = 'Error al realizar la búsqueda';
          // En caso de error, mostrar las citas locales filtradas
          this.filterAppointments();
        }
      });
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
    return this.appointments.filter(
      (appointment) => appointment.status === status
    );
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
}
