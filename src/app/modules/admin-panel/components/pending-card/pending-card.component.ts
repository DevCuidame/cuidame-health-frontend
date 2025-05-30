import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faClock,
  faCalendar,
  faEllipsisV,
} from '@fortawesome/free-solid-svg-icons';
import { Appointment } from 'src/app/core/interfaces/appointment.interface';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/core/services/toast.service';
import { AlertController, IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pending-card',
  imports: [
    CustomButtonComponent,
    CommonModule,
    FontAwesomeModule,
    IonicModule,
    FormsModule,
  ],
  templateUrl: './pending-card.component.html',
  styleUrls: ['./pending-card.component.scss'],
})
export class PendingCardComponent implements OnInit {
  @Input() appointment!: Appointment;
  @Input() color: string = '';
  
  public environment = environment.url;
  public buttonBackground: string = 'assets/background/button_primary_bg.png';
  public confirmButtonBackground: string = 'assets/background/primary_button_bg.svg';
  
  public faClock = faClock;
  public faCalendar = faCalendar;
  public faEllipsisV = faEllipsisV;
  
  public showStatusMenu = false;
  public statusUpdating = false;
  
  // Datos procesados
  public patientFullName: string = '';
  public professionalFullName: string = '';
  public formattedDate: string = '';
  public formattedTime: string = '';
  public hasValidSchedule: boolean = false;

  constructor(
    private router: Router,
    private appointmentService: AppointmentService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.initializeCardData();
    this.logInitialState(); // Para consistencia y depuración
  }

  private initializeCardData(): void {
    if (!this.appointment) {
      console.error('Error: No se proporcionó la cita (appointment) para PendingCardComponent.');
      this.patientFullName = 'Error: Datos no disponibles';
      this.professionalFullName = 'Error: Datos no disponibles';
      this.formattedDate = 'Error';
      this.formattedTime = 'Error';
      this.hasValidSchedule = false;
      return;
    }

    if (!this.isValidAppointmentData(this.appointment)) {
      // Aún así, intentamos mostrar lo que se pueda
    }

    this.patientFullName = this.formatPatientFullName(this.appointment.patient);
    this.professionalFullName = this.formatProfessionalFullName(this.appointment.professional);
    this.hasValidSchedule = this.tryProcessSchedule(this.appointment.start_time);
  }

  private logInitialState(): void {
    console.log('PendingCardComponent initialized with:', {
      appointmentId: this.appointment?.id,
      patient: this.patientFullName,
      professional: this.professionalFullName,
      date: this.formattedDate,
      time: this.formattedTime,
      hasValidSchedule: this.hasValidSchedule,
      status: this.appointment?.status
    });
  }

  private isValidAppointmentData(appointment: Appointment): boolean {
    // Validaciones más robustas
    return !!(
      appointment &&
      typeof appointment.id === 'number' &&
      appointment.patient &&
      typeof appointment.patient.nombre === 'string' && // Asumiendo que nombre es siempre string
      appointment.specialty &&
      typeof appointment.specialty.name === 'string' // Asumiendo que specialty tiene un nombre
    );
  }

  private formatPatientFullName(patient: Appointment['patient']): string {
    if (!patient) return 'Paciente no asignado';
    const { nombre, apellido } = patient;
    const fullName = `${nombre || ''} ${apellido || ''}`.trim();
    return fullName || 'Paciente sin nombre registrado';
  }

  private formatProfessionalFullName(professional: Appointment['professional']): string {
    if (!professional?.user) return 'Profesional no asignado';
    const { first_name, last_name } = professional.user;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();
    return fullName || 'Profesional sin nombre registrado';
  }

  private tryProcessSchedule(startTime?: string | Date): boolean {
    if (!startTime) {
      this.formattedDate = 'Fecha no disponible';
      this.formattedTime = 'Hora no disponible';
      return false;
    }

    try {
      const date = new Date(startTime);
      if (isNaN(date.getTime())) {
        this.formattedDate = 'Fecha inválida';
        this.formattedTime = 'Hora inválida';
        return false;
      }

      // Opcional: Validación de fecha futura razonable (ej. no más de 5 años en el futuro)
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
      if (date > fiveYearsFromNow) {
        this.formattedDate = 'Fecha muy lejana';
        this.formattedTime = '';
        return false;
      }

      this.formattedDate = date.toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      this.formattedTime = date.toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', hour12: true // Considerar formato AM/PM
      });
      return true;
    } catch (error) {
      console.error('Error al procesar la fecha de la cita:', startTime, error);
      this.formattedDate = 'Error de fecha';
      this.formattedTime = 'Error de hora';
      return false;
    }
  }

  public getPatientImage(): string {
    const patientPhotoUrl = this.appointment?.patient?.photourl;
    if (patientPhotoUrl) {
      // Asegurarse de que la URL base no termine con / si photourl ya empieza con /
      const baseUrl = this.environment.endsWith('/') ? this.environment.slice(0, -1) : this.environment;
      const photoPath = patientPhotoUrl.startsWith('/') ? patientPhotoUrl : `/${patientPhotoUrl}`;
      return `${baseUrl}${photoPath}`;
    }
    return 'assets/images/default_user.png'; // Ruta a imagen por defecto local
  }

  public canAssignSchedule(): boolean {
    return this.appointment.status === 'requested' && !this.hasValidSchedule;
  }

  public canConfirm(): boolean {
    return this.appointment.status === 'requested' && this.hasValidSchedule;
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/default_user.png';
  }
  

  toggleStatusMenu(event: Event): void {
    event.stopPropagation();
    
    if (this.appointment.status === 'cancelled') {
      return;
    }

    this.showStatusMenu = !this.showStatusMenu;

    if (this.showStatusMenu) {
      setTimeout(() => {
        const closeHandler = () => {
          this.showStatusMenu = false;
          document.removeEventListener('click', closeHandler);
        };
        document.addEventListener('click', closeHandler);
      }, 0);
    }
  }

  updateStatus(newStatus: string): void {
    if (this.statusUpdating || this.appointment.status === newStatus) {
      this.showStatusMenu = false;
      return;
    }

    this.statusUpdating = true;
    const previousStatus = this.appointment.status;

    this.appointmentService
      .updateAppointmentStatus(this.appointment.id, newStatus)
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.appointment.status = newStatus;
            this.toastService.presentToast(
              `Estado actualizado correctamente`,
              'success'
            );
          } else {
            this.appointment.status = previousStatus;
            this.toastService.presentToast(
              'Error al actualizar el estado',
              'danger'
            );
          }
          this.statusUpdating = false;
        },
        error: () => {
          this.appointment.status = previousStatus;
          this.toastService.presentToast(
            'Error al actualizar el estado',
            'danger'
          );
          this.statusUpdating = false;
        }
      });

    this.showStatusMenu = false;
  }

  goToAppointment(appointment: Appointment): void {
    // Validar datos mínimos antes de navegar
    if (!this.validateAppointmentForNavigation(appointment)) {
      return;
    }

    // Limpiar datos temporales previos
    this.cleanupTemporaryData(appointment);

    // Guardar el appointment actual
    localStorage.setItem('selectedAppointment', JSON.stringify(appointment));
    
    // Navegar al wizard con el modo apropiado
    this.router.navigate(['/admin-panel/dash/pending'], {
      state: { 
        appointment,
        scheduleAssignment: this.needsScheduleAssignment(),
        mode: this.needsScheduleAssignment() ? 'schedule' : 'edit'
      }
    });
  }

  /**
   * Validar que la cita tenga los datos necesarios para navegar al wizard
   */
  private validateAppointmentForNavigation(appointment: Appointment): boolean {
    if (!appointment || !appointment.id) {
      this.toastService.presentToast('Error: Datos de cita inválidos', 'danger');
      return false;
    }

    if (!appointment.patient || !appointment.patient.nombre) {
      this.toastService.presentToast('Error: Datos del paciente incompletos', 'danger');
      return false;
    }

    if (!appointment.specialty) {
      this.toastService.presentToast('Error: Especialidad no especificada', 'danger');
      return false;
    }

    return true;
  }

  /**
   * Limpiar datos temporales que puedan causar inconsistencias
   */
  private cleanupTemporaryData(appointment: Appointment): void {
    // Eliminar campos temporales que no deberían persistir
    const cleanedAppointment = { ...appointment };
    
    // Remover campos temporales si existen
    delete (cleanedAppointment as any).temp_doctor_name;
    delete (cleanedAppointment as any).temp_address;
    delete (cleanedAppointment as any).professionalData;
    delete (cleanedAppointment as any).userData;
    
    // Actualizar el appointment con datos limpios
    Object.assign(appointment, cleanedAppointment);
  }

  async confirmAppointment(appointment: Appointment): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar cita',
      message: `¿Confirmar la cita de ${this.patientFullName} para el ${this.formattedDate} a las ${this.formattedTime}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.updateStatus('confirmed');
          }
        }
      ]
    });

    await alert.present();
  }

  getStatusLabel(): string {
    const statusMap: { [key: string]: string } = {
      'requested': 'Solicitada',
      'confirmed': 'Confirmada',
      'rescheduled': 'Reagendada',
      'cancelled': 'Cancelada',
      'completed': 'Completada'
    };
    
    return statusMap[this.appointment.status] || 'Desconocido';
  }

  getPatientStatusColor(): string {
    const colorMap: { [key: string]: string } = {
      'requested': '#ffc107',
      'confirmed': '#28a745',
      'rescheduled': '#17a2b8',
      'cancelled': '#dc3545',
      'completed': '#6c757d'
    };
    
    return colorMap[this.appointment.status] || '#00c292';
  }

  /**
   * Verificar si la cita necesita asignación de profesional
   */
  isUnassignedAppointment(): boolean {
    return !this.appointment?.professional || !this.hasValidSchedule;
  }

  /**
   * Verificar si la cita necesita asignación de horario
   * Unificamos la lógica que estaba duplicada
   */
  needsScheduleAssignment(): boolean {
    return !this.hasValidSchedule;
  }

    getStatusBadgeClass(): any {
    const baseClass = 'status-badge';

    switch (this.appointment.status) {
      case 'requested':
        return {
          [baseClass]: true,
          'pending-badge': true,
          'badge-secondary': true,
        };
      case 'confirmed':
        return {
          [baseClass]: true,
          'confirmed-badge': true,
          'badge-primary': true,
        };

      case 'rescheduled':
        return {
          [baseClass]: true,
          'rescheduled-badge': true,
          'badge-secondary': true,
        };
      case 'cancelled':
        return {
          [baseClass]: true,
          'cancelled-badge': true,
          'badge-danger': true,
        };
      case 'completed':
        return {
          [baseClass]: true,
          'to-be-confirmed-badge': true,
          'badge-warning': true,
        };
      default:
        return {
          [baseClass]: true,
        };
    }
  }
}