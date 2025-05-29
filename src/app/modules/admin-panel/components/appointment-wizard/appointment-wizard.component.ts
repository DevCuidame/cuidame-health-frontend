import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/core/services/toast.service';
import { Router } from '@angular/router';
import { Appointment, Specialty } from 'src/app/core/interfaces/appointment.interface';
import { AppointmentStateService } from 'src/app/core/services/appointment/appointment-state.service';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';
import { PatientDataStepComponent } from '../patient-data-step/patient-data-step.component';
import { SpecialtySelectionStepComponent } from '../specialty-selection-step/specialty-selection-step.component';
import { ScheduleSelectionStepComponent } from '../schedule-selection-step/schedule-selection-step.component';
import { AppointmentAssignedComponent } from '../appointment-assigned/appointment-assigned.component';
import { WizardStepperComponent } from '../wizard-stepper/wizard-stepper.component';

@Component({
  selector: 'app-appointment-wizard',
  standalone: true,
  imports: [
    CommonModule,
    PatientDataStepComponent,
    SpecialtySelectionStepComponent,
    ScheduleSelectionStepComponent,
    AppointmentAssignedComponent,
    WizardStepperComponent,
  ],
  template: `
    @if(!success()) {
    <div class="wizard-container">
      <!-- Componente de stepper -->
      <app-wizard-stepper
        [currentStep]="currentStep()"
        [isScheduleAssignment]="isScheduleAssignment"
        [isModifiedFlow]="true"
      ></app-wizard-stepper>

      <!-- Contenido de los pasos -->
      <div class="wizard-content">
        @if (currentStep() === 1 && !isScheduleAssignment) {
        <app-patient-data-step></app-patient-data-step>
        } @else if (currentStep() === 2 && !isScheduleAssignment) {
        <app-specialty-selection-step></app-specialty-selection-step>
        } @else if (currentStep() === 3 || isScheduleAssignment) {
        <app-schedule-selection-step
          [isAssigningToPendingAppointment]="isScheduleAssignment"
        ></app-schedule-selection-step>
        }
      </div>

      <!-- Botones de navegación -->
      <div class="buttons-container">
        <button
          class="prev-button"
          (click)="prevStep()"
          [disabled]="
            (currentStep() === 1 && !isScheduleAssignment) || isSubmitting()
          "
        >
          Anterior
        </button>
        <button
          class="next-button"
          (click)="nextStep()"
          [disabled]="!isStepValid() || isSubmitting()"
        >
          <span *ngIf="!(currentStep() === 3 && isSubmitting())">
            @if (isScheduleAssignment) { 
              @if (isManualAgenda()) { 
                Confirmar cita 
              } @else { 
                Confirmar horario 
              } 
            } @else { 
              @if (currentStep() < 3) {
                Siguiente 
              } @else { 
                Confirmar cita
              } 
            }
          </span>
          <span
            *ngIf="currentStep() === 3 && isSubmitting()"
            class="button-loading"
          >
            <i class="fas fa-spinner fa-spin"></i> Procesando...
          </span>
        </button>
      </div>
    </div>
    } @else {
    <app-appointment-assigned
      [isPending]="isAgendaPendiente()"
      [isManual]="isManualAgenda()"
      [patientName]="getFullName()"
      [professionalName]="getSelectedProfessionalName()"
      [professionalPhone]="getProfessionalPhone()"
      [specialty]="getSelectedSpecialty()"
      [date]="appointment().start_time"
      [time]="appointment().start_time!"
      [dayOfWeek]="getFormattedDayOfWeek()"
      [appointment]="appointment()"
    ></app-appointment-assigned>

    <div class="action-buttons">
      <button class="back-button" (click)="goBackToAppointments()">
        Volver a citas
      </button>
    </div>
    }
  `,
  styleUrls: ['./appointment-wizard.component.scss'],
})
export class AppointmentWizardComponent implements OnInit, OnDestroy {
  public currentStep = this.stateService.currentStep;
  public isSubmitting = this.stateService.isSubmitting;
  public success = this.stateService.success;
  public appointment = this.stateService.appointment;
  public isScheduleAssignment: boolean = false;
  
  // Modo de operación
  private mode: 'new' | 'schedule' | 'edit' = 'new';

  constructor(
    private stateService: AppointmentStateService,
    private appointmentService: AppointmentService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeWizard();
  }

  ngOnDestroy(): void {
    // Limpiar estado si no se completó el proceso
    if (!this.success()) {
      this.stateService.resetState();
    }
  }

  private initializeWizard(): void {
    const navData = history.state;
    
    if (navData?.scheduleAssignment === true) {
      this.mode = 'schedule';
      this.isScheduleAssignment = true;
      this.stateService.currentStep.set(3);
    } else if (navData?.appointment) {
      this.mode = 'edit';
      this.loadExistingAppointment(navData.appointment);
    } else {
      this.mode = 'new';
      this.stateService.resetState();
    }
  }

  private loadExistingAppointment(appointment: Appointment): void {
    // Validar datos mínimos requeridos
    if (!appointment.patient || !appointment.specialty) {
      this.toastService.presentToast('Datos de cita incompletos', 'danger');
      this.router.navigate(['/admin-panel/dash/assigment']);
      return;
    }

    this.stateService.appointment.set(appointment);
    localStorage.setItem('selectedAppointment', JSON.stringify(appointment));
  }

  nextStep(): void {
    if (!this.isStepValid()) {
      this.showValidationError();
      return;
    }

    this.stateService.updateAppointmentForStep();

    if (this.isScheduleAssignment || this.currentStep() === 3) {
      this.submitAppointment();
    } else {
      this.stateService.nextStep();
    }
  }

  prevStep(): void {
    if (this.isScheduleAssignment) {
      this.router.navigate(['/admin-panel/dash/assigment']);
    } else {
      this.stateService.prevStep();
    }
  }

  public isStepValid(): boolean {
    if (this.isScheduleAssignment) {
      return this.validateScheduleData();
    }
    
    return this.stateService.isStepValid(this.currentStep());
  }

  private validateScheduleData(): boolean {
    const appointment = this.stateService.appointment();
    
    // Validar que tenga información básica del doctor
    if (!appointment.professional || !appointment.professional.user) {
      return false;
    }

    // Si tiene fecha/hora, ambas deben estar presentes
    if (appointment.start_time || appointment.end_time) {
      return !!(appointment.start_time && appointment.end_time);
    }

    return true;
  }

  private showValidationError(): void {
    const errorMessages: { [key: number]: string } = {
      1: 'Complete los datos del paciente',
      2: 'Seleccione una especialidad',
      3: 'Complete la información del horario'
    };

    const message = this.isScheduleAssignment 
      ? 'Complete la información del profesional y horario'
      : errorMessages[this.currentStep()] || 'Complete todos los campos requeridos';

    this.toastService.presentToast(message, 'warning');
  }

  private submitAppointment(): void {
    this.stateService.setSubmitting(true);
    const appointmentData = this.prepareAppointmentData();

    if (this.mode === 'new') {
      this.createNewAppointment(appointmentData);
    } else {
      this.updateExistingAppointment(appointmentData);
    }
  }

  private prepareAppointmentData(): Appointment {
    const appointment = this.stateService.appointment();
    
    // Validar datos mínimos antes de preparar
    if (!this.validateAppointmentData(appointment)) {
      throw new Error('Datos de cita incompletos para envío');
    }
    
    // Limpiar y estructurar datos para envío
    const cleanedAppointment: Appointment = {
      id: appointment.id,
      patient_id: appointment.patient_id || appointment.patient?.id || 0,
      professional_id: this.extractProfessionalId(appointment),
      appointment_type_id: appointment.appointment_type_id || 1, // Valor por defecto
      start_time: appointment.start_time || '',
      end_time: appointment.end_time || appointment.start_time || '',
      status: this.determineStatus(appointment),
      notes: appointment.notes || '',
      specialty_id: appointment.specialty_id || appointment.specialty?.id || 0,
      patient: appointment.patient,
      specialty: appointment.specialty,
      professional: this.cleanProfessionalData(appointment.professional),
      created_at: appointment.created_at || '',
      updated_at: appointment.updated_at || '',
      cancellation_reason: null,
      reminder_sent: false,
      location: appointment.location || null,
      modified_by_id: null,
      recurring_appointment_id: null
    };

    return cleanedAppointment;
  }

  /**
   * Validar que los datos de la cita sean suficientes para envío
   */
  private validateAppointmentData(appointment: Appointment): boolean {
    return !!(appointment.patient && 
             appointment.patient.nombre && 
             appointment.specialty && 
             (appointment.specialty_id || appointment.specialty.id));
  }

  /**
   * Extraer ID del profesional de forma segura
   */
  private extractProfessionalId(appointment: Appointment): number | null {
    if (appointment.professional_id) {
      return appointment.professional_id;
    }
    
    if (appointment.professional?.id) {
      return appointment.professional.id;
    }
    
    return null;
  }

  /**
   * Limpiar datos del profesional eliminando campos temporales
   */
  private cleanProfessionalData(professional: any): any {
    if (!professional) {
      return null;
    }
    
    // Crear copia limpia sin campos temporales
    const cleanedProfessional = { ...professional };
    
    // Eliminar campos temporales que no deberían enviarse al backend
    delete cleanedProfessional.professionalData;
    delete cleanedProfessional.scheduleInfo;
    
    return cleanedProfessional;
  }

  private determineStatus(appointment: Appointment): string {
    if (this.isScheduleAssignment) {
      return 'confirmed';
    }
    
    if (appointment.start_time && appointment.professional_id) {
      return 'confirmed';
    }
    
    return 'requested';
  }

  private createNewAppointment(appointmentData: Appointment): void {
    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (response) => {
        this.handleSuccess(response, 'Cita creada exitosamente');
      },
      error: (error) => {
        this.handleError(error, 'Error al crear la cita');
      }
    });
  }

  private updateExistingAppointment(appointmentData: Appointment): void {
    this.appointmentService
      .updateAppointment(appointmentData.id, appointmentData)
      .subscribe({
        next: (response) => {
          this.handleSuccess(response, 'Cita actualizada exitosamente');
        },
        error: (error) => {
          this.handleError(error, 'Error al actualizar la cita');
        }
      });
  }

  private handleSuccess(response: any, message: string): void {
    this.stateService.setSubmitting(false);
    
    if (response?.data) {
      this.stateService.appointment.set(response.data);
      this.stateService.setSuccess(true);
      this.toastService.presentToast(message, 'success');
    } else {
      this.handleError(null, 'Respuesta inválida del servidor');
    }
  }

  private handleError(error: any, message: string): void {
    this.stateService.setSubmitting(false);
    console.error(error);
    this.toastService.presentToast(message, 'danger');
  }

  goBackToAppointments(): void {
    this.stateService.resetState();
    this.router.navigate(['/admin-panel/dash/assigment']);
  }

  isManualAgenda(): boolean {
    return true; 
  }

  isAgendaPendiente(): boolean {
    const status = this.appointment().status;
    return status === 'requested' || status === 'TO_BE_CONFIRMED';
  }

  getFullName(): string {
    const patient = this.appointment().patient;
    if (patient) {
      return `${patient.nombre || ''} ${patient.apellido || ''}`.trim();
    }
    return '';
  }

  getSelectedProfessionalName(): string {
    const professional = this.appointment().professional;
    if (professional?.user) {
      return `${professional.user.first_name || ''} ${professional.user.last_name || ''}`.trim();
    }
    return '';
  }

  getProfessionalPhone(): string {
    return this.appointment().professional?.user?.phone || '';
  }

  getSelectedSpecialty(): any {
    return this.appointment().specialty || { name: 'Sin especialidad' };
  }

  getFormattedDayOfWeek(): string {
    const startTime = this.appointment().start_time;
    if (!startTime) return '';
    
    try {
      const date = new Date(startTime);
      return date.toLocaleDateString('es-ES', { weekday: 'long' });
    } catch {
      return '';
    }
  }
}