import { AppointmentTypeService } from './../../../../core/services/appointment/appointment-type.service';
import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  OnInit,
  OnDestroy,
  runInInjectionContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { identificationOptions } from 'src/app/core/constants/indentifications';
import { ToastService } from 'src/app/core/services/toast.service';
import { PatientSearchService } from 'src/app/core/services/patient-search.service';
import { Subscription } from 'rxjs';
import { AppointmentStateService } from 'src/app/core/services/appointment/appointment-state.service';

@Component({
  selector: 'app-patient-data-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-content">
      <h2>Datos del paciente</h2>

      <!-- Identificación -->
      <div class="form-group">
        <label>Identificación</label>
        <div class="row search-row">
          <select
            [(ngModel)]="appointmentData.patient.tipoid"
            (change)="onIdentificationChange()"
          >
            <option value="">Seleccione</option>
            @for (option of identificationOptions; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <input
            type="text"
            placeholder="#"
            [(ngModel)]="appointmentData.patient.numeroid"
            (ngModelChange)="onIdentificationNumberChange()"
          />

          <button
            type="button"
            class="search-button"
            (click)="searchUser()"
            [disabled]="!canSearch"
          >
            <i class="fas fa-search"></i> Buscar
            <span *ngIf="searchState.loading" class="loading-indicator"></span>
          </button>
        </div>

        <!-- Estado de búsqueda -->
        <div class="search-status">
          <div *ngIf="searchState?.loading" class="status-message loading">
            <i class="fas fa-spinner fa-spin"></i> Buscando usuario...
          </div>
          <div *ngIf="searchState?.notFound" class="status-message not-found">
            <i class="fas fa-exclamation-circle"></i> Usuario no encontrado.
          </div>
          <div *ngIf="searchState?.success" class="status-message success">
            <i class="fas fa-check-circle"></i> Usuario encontrado:
            {{ getFullName() }}
          </div>
          <div *ngIf="searchState?.error" class="status-message error">
            <i class="fas fa-times-circle"></i> Error al buscar el usuario. Por
            favor intente nuevamente.
          </div>
        </div>
      </div>

      <!-- Nombres y apellidos -->
      <div class="form-group">
        <label>Nombres y apellidos</label>
        <input type="text" [disabled]="true" [value]="getFullName()" />
      </div>

      <!-- Teléfono -->
      <div class="form-group">
        <div class="row">
          <div class="item">
            <label>Teléfono</label>
            <input
              type="text"
              [disabled]="true"
              [(ngModel)]="appointmentData.patient.telefono"
            />
          </div>
        </div>
      </div>

      <!-- Tipo de cita -->
      <div class="form-group">
        <label>Tipo de Cita</label>
        <select
          [(ngModel)]="selectedAppointmentTypeId"
          (ngModelChange)="onAppointmentTypeChange($event)"
          class="appointment-type-select"
        >
          <option value="" disabled>Seleccione tipo de cita</option>
          @for (type of appointmentTypes(); track type.id) {
            <option [value]="type.id">{{ type.name }}</option>
          }
        </select>

        @if (selectedAppointmentType) {
          <div class="type-description">
            <p><strong>Descripción:</strong> {{ selectedAppointmentType.description }}</p>
            @if (selectedAppointmentType.default_duration) {
              <p><strong>Duración:</strong> {{ selectedAppointmentType.default_duration }} minutos</p>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./patient-data-step.component.scss'],
})
export class PatientDataStepComponent implements OnInit, OnDestroy {
  public identificationOptions = identificationOptions;
  public appointmentData: any = { patient: {} };
  public searchState: any = {};
  public selectedAppointmentTypeId: number | string = '';
  public selectedAppointmentType: any = null;
  
  private debounceTimeout: any;
  private subscription: Subscription = new Subscription();
  private injector = inject(Injector);

  constructor(
    private stateService: AppointmentStateService,
    private patientSearchService: PatientSearchService,
    private toastService: ToastService,
    private appointmentTypeService: AppointmentTypeService
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.setupStateSubscription();
    this.loadAppointmentTypes();
  }

  ngOnDestroy(): void {
    this.cleanupResources();
  }

  /**
   * Computed property para obtener los tipos de cita
   */
  public appointmentTypes = computed(() => {
    return this.appointmentTypeService.appointmentTypes() || [];
  });

  /**
   * Inicializar datos del componente
   */
  private initializeData(): void {
    this.appointmentData = this.stateService.appointment() || { patient: {} };
    this.searchState = this.stateService.searchState() || {};

    // Asegurar que patient existe
    if (!this.appointmentData.patient) {
      this.appointmentData.patient = {};
    }

    // Cargar tipo de cita seleccionado si existe
    if (this.appointmentData.appointment_type_id) {
      this.selectedAppointmentTypeId = this.appointmentData.appointment_type_id;
      this.updateSelectedAppointmentType(this.appointmentData.appointment_type_id);
    }
  }

  /**
   * Configurar suscripción a cambios de estado
   */
  private setupStateSubscription(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.searchState = this.stateService.searchState();
        this.appointmentData = this.stateService.appointment();

        // Validar estructura de datos
        if (!this.appointmentData.patient) {
          this.appointmentData.patient = {};
        }

        // Actualizar tipo de cita seleccionado
        if (this.appointmentData.appointment_type_id && 
            this.appointmentData.appointment_type_id !== this.selectedAppointmentTypeId) {
          this.selectedAppointmentTypeId = this.appointmentData.appointment_type_id;
          this.updateSelectedAppointmentType(this.appointmentData.appointment_type_id);
        }
      });
    });
  }

  /**
   * Cargar tipos de cita disponibles
   */
  private loadAppointmentTypes(): void {
    if (!this.appointmentTypeService.appointmentTypes().length) {
      this.appointmentTypeService.fetchTypes().subscribe({
        next: () => {
          // Si hay un tipo seleccionado, actualizar la referencia
          if (this.selectedAppointmentTypeId) {
            this.updateSelectedAppointmentType(this.selectedAppointmentTypeId);
          }
        },
        error: (error) => {
          console.error('Error cargando tipos de cita:', error);
          this.toastService.presentToast(
            'Error al cargar tipos de cita',
            'danger'
          );
        },
      });
    }
  }

  /**
   * Manejar cambio de tipo de cita
   */
  onAppointmentTypeChange(typeId: number | string): void {
    if (!typeId) return;

    const numericId = typeof typeId === 'string' ? parseInt(typeId, 10) : typeId;
    
    // Actualizar el tipo seleccionado
    this.updateSelectedAppointmentType(numericId);
    
    // Actualizar en el estado
    this.stateService.appointment.update((app) => ({
      ...app,
      appointment_type_id: numericId,
      appointmentType: this.selectedAppointmentType
    }));
  }

  /**
   * Actualizar el tipo de cita seleccionado
   */
  private updateSelectedAppointmentType(typeId: number | string): void {
    const numericId = typeof typeId === 'string' ? parseInt(typeId, 10) : typeId;
    const types = this.appointmentTypes();
    
    this.selectedAppointmentType = types.find(type => type.id === numericId) || null;
  }

  /**
   * Limpiar recursos al destruir el componente
   */
  private cleanupResources(): void {
    this.subscription.unsubscribe();

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }

  get canSearch(): boolean {
    return this.isValidIdentification() && !this.searchState.loading;
  }

  /**
   * Validar que los datos de identificación sean válidos
   */
  private isValidIdentification(): boolean {
    const patient = this.appointmentData?.patient;
    if (!patient) return false;

    const idType = patient.tipoid?.trim();
    const idNumber = patient.numeroid?.trim();

    return !!(idType && idNumber && idNumber.length >= 3);
  }

  /**
   * Buscar usuario por identificación
   */
  searchUser(): void {
    if (!this.isValidIdentification()) {
      this.toastService.presentToast(
        'Por favor, ingrese tipo y número de identificación válidos',
        'warning'
      );
      return;
    }

    const patient = this.appointmentData.patient;
    const idType = patient.tipoid.trim();
    const idNumber = patient.numeroid.trim();

    this.patientSearchService
      .searchUserByIdentification(idType, idNumber)
      .subscribe();
  }

  /**
   * Manejar cambio en tipo de identificación
   */
  onIdentificationChange(): void {
    this.updatePatientField('tipoid', this.appointmentData.patient.tipoid);
    this.resetSearchStateIfNeeded();
  }

  /**
   * Manejar cambio en número de identificación
   */
  onIdentificationNumberChange(): void {
    this.updatePatientField('numeroid', this.appointmentData.patient.numeroid);
    this.scheduleAutoSearch();
  }

  /**
   * Actualizar campo específico del paciente
   */
  private updatePatientField(field: string, value: any): void {
    this.stateService.appointment.update((app) => ({
      ...app,
      patient: {
        ...app.patient,
        [field]: value,
      },
    }));
  }

  /**
   * Resetear estado de búsqueda si es necesario
   */
  private resetSearchStateIfNeeded(): void {
    if (this.searchState.success || this.searchState.notFound) {
      this.stateService.searchState.set({
        loading: false,
        success: false,
        notFound: false,
        error: false,
      });
    }
  }

  /**
   * Programar búsqueda automática con debounce
   */
  private scheduleAutoSearch(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.resetSearchStateIfNeeded();

    if (this.isValidIdentification()) {
      this.debounceTimeout = setTimeout(() => {
        this.searchUser();
      }, 800);
    }
  }

  /**
   * Obtener nombre completo del paciente
   */
  getFullName(): string {
    const patient = this.appointmentData?.patient;
    if (!patient) return 'Sin datos del paciente';

    const firstName = patient.nombre?.trim() || patient.first_name?.trim() || '';
    const lastName = patient.apellido?.trim() || patient.last_name?.trim() || '';

    if (!firstName && !lastName) {
      return 'Paciente sin nombre';
    }

    return `${firstName} ${lastName}`.trim();
  }
}