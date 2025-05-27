import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faCrown, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Appointment } from 'src/app/core/interfaces/appointment.interface';
import { ToastService } from 'src/app/core/services/toast.service';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';
import { Specialty } from 'src/app/core/interfaces/appointment.interface';
import { catchError, EMPTY } from 'rxjs';

@Component({
  selector: 'app-appointment-assigned',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="assigned-container">
      <h2 class="title">
        {{getAppointmentTitle()}}
      </h2>

      <div class="assigned-card">
        <div class="icons">
          <fa-icon [icon]="faCrown" class="crown-icon"></fa-icon>
          @if(isManual) {
            <fa-icon [icon]="faExclamationTriangle" class="warning-icon"></fa-icon>
          } @else {
            <fa-icon [icon]="faCheckCircle" class="check-icon"></fa-icon>
          }
        </div>
        
        @if(isManual) {
          <p>
            La cita con el profesional <strong>{{professionalName || 'seleccionado'}}</strong> 
            queda pendiente por asignación. 
            @if (professionalPhone) {
              Por favor comuníquese con el profesional mediante WhatsApp para coordinar la cita.
            } @else {
              El equipo de atención se comunicará con usted para coordinar la fecha y hora exacta.
            }
          </p>
          @if (professionalPhone) {
            <div class="actions-container">
              <button class="whatsapp-button" (click)="openWhatsApp()">
                Contactar por WhatsApp
              </button>
              <button class="save-button" (click)="savePendingAppointment()">
                Guardar cita pendiente
              </button>
            </div>
          } @else {
            <div class="actions-container">
              <button class="save-button" (click)="savePendingAppointment()">
                Guardar cita pendiente
              </button>
            </div>
          }
        } @else if(isPending) {
          <p>
            La cita con <strong>{{professionalName || 'el profesional seleccionado'}}</strong> 
            para la especialidad de <strong>{{specialty}}</strong> queda pendiente por asignación 
            y será confirmada máximo en 72 horas.
          </p>
          <p class="additional-info">
            ¿Necesitas indicaciones para llegar a la clínica?
            <a href="https://maps.google.com" target="_blank">Mira nuestro mapa en Google Maps.</a>
          </p>
        } @else {
          <p>
            La hora de atención para <strong>{{ patientName || 'el paciente' }}</strong> ya está
            reservada para el próximo <strong>{{ dayOfWeek || 'día' }}, {{ getFormattedDate() }}</strong> a
            las <strong>{{ time || '(por confirmar)' }}</strong> Hrs. con 
            <strong>{{ professionalName || 'el profesional' }}</strong> 
            ({{ specialty || 'especialidad seleccionada' }}) en 
            <strong>{{ getDoctorLocation() }}</strong>.
          </p>
          <p>
            Se ha enviado un correo con la confirmación de la cita al paciente y a la
            agenda del profesional.
          </p>
        }
      </div>
    </div>
  `,
  styleUrls: ['./appointment-assigned.component.scss'],
})
export class AppointmentAssignedComponent implements OnInit {
  @Input() public isPending: boolean = false;
  @Input() public isManual: boolean = false;
  @Input() public patientName: string = '';
  @Input() public professionalName: string = '';
  @Input() public professionalPhone: string = '';
  @Input() public specialty!: Specialty;
  @Input() public date: string = '';
  @Input() public time: string = '';
  @Input() public dayOfWeek: string = '';
  @Input() public appointment: Appointment | null = null;
  @Output() public appointmentSaved = new EventEmitter<boolean>();

  public faCheckCircle = faCheckCircle;
  public faCrown = faCrown;
  public faExclamationTriangle = faExclamationTriangle;
  
  constructor(
    private appointmentService: AppointmentService,
    private toastService: ToastService
  ) {}
  
  ngOnInit() {
    this.logInitialState();
    this.initializeDefaultValues();
  }

  private logInitialState(): void {
    console.log('AppointmentAssignedComponent initialized with:', {
      isPending: this.isPending,
      isManual: this.isManual,
      patientName: this.patientName,
      professionalName: this.professionalName,
      specialty: this.specialty?.name,
      date: this.date,
      time: this.time,
      dayOfWeek: this.dayOfWeek,
      appointmentId: this.appointment?.id
    });
  }

  private initializeDefaultValues(): void {
    if (!this.professionalName && this.appointment?.professional?.user) {
      this.professionalName = this.formatFullName(this.appointment.professional.user.first_name, this.appointment.professional.user.last_name);
    }

    if (!this.specialty && this.appointment?.specialty) {
      this.specialty = this.appointment.specialty;
    }

    if (!this.patientName && this.appointment?.patient) {
      this.patientName = this.formatFullName(this.appointment.patient.nombre, this.appointment.patient.apellido);
    }
  }

  private formatFullName(firstName?: string, lastName?: string): string {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }
  
  getAppointmentTitle(): string {
    if (this.isManual) return 'CITA PENDIENTE POR ASIGNACIÓN';
    if (this.isPending) return 'CITA PENDIENTE';
    return 'CITA ASIGNADA';
  }
  
  getFormattedDate(): string {
    if (!this.date) return '(fecha por confirmar)';
    
    try {
      const dateObj = new Date(this.date);
      // Asegurarse de que la fecha es válida antes de formatear
      if (isNaN(dateObj.getTime())) {
        console.warn('Fecha inválida proporcionada:', this.date);
        return this.date; // Devolver la fecha original si no es válida
      }
      return dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error al formatear la fecha:', this.date, e);
      return this.date; // Devolver la fecha original en caso de error
    }
  }
  
  getDoctorLocation(): string {
    const professional = this.appointment?.professional;
    if (!professional) return 'la dirección indicada';

    const { consultation_address: address, attention_township_name: city } = professional;

    if (address && city) return `${address}, ${city}`;
    if (address) return address;
    if (city) return city;
    return 'la dirección indicada';
  }
  
  savePendingAppointment(): void {
    if (!this.isValidAppointmentForSave()) {
      return;
    }

    const appointmentToSave: Appointment = {
      ...(this.appointment as Appointment),
      status: 'TO_BE_CONFIRMED'
    };

    this.appointmentService.createAppointment(appointmentToSave)
      .pipe(
        catchError(error => {
          this.handleSaveAppointmentError(error);
          return EMPTY; // Devuelve un observable vacío para manejar el error y no romper la cadena
        })
      )
      .subscribe({
        next: () => {
          this.handleSaveAppointmentSuccess();
        }
      });
  }

  private isValidAppointmentForSave(): boolean {
    if (!this.appointment) {
      this.toastService.presentToast('No hay datos de cita para guardar.', 'danger');
      return false;
    }
    // Aquí se podrían añadir más validaciones si fueran necesarias
    return true;
  }

  private handleSaveAppointmentSuccess(): void {
    this.toastService.presentToast('Cita pendiente guardada exitosamente.', 'success');
    this.appointmentSaved.emit(true);
  }

  private handleSaveAppointmentError(error: any): void {
    console.error('Error al guardar la cita pendiente:', error);
    const errorMessage = error?.error?.message || 'Error desconocido al guardar la cita pendiente.';
    this.toastService.presentToast(errorMessage, 'danger');
    this.appointmentSaved.emit(false);
  }

  openWhatsApp(): void {
    if (!this.professionalPhone) {
      this.toastService.presentToast('Número de WhatsApp del profesional no disponible.', 'warning');
      return;
    }

    const cleanedPhone = this.cleanPhoneNumber(this.professionalPhone);
    if (!cleanedPhone) {
      this.toastService.presentToast('Número de WhatsApp inválido.', 'warning');
      return;
    }

    const whatsappUrl = `https://wa.me/${cleanedPhone}`;
    this.openUrlInNewTab(whatsappUrl);
  }

  private cleanPhoneNumber(phone: string): string {
    // Elimina caracteres no numéricos. Considerar prefijos internacionales si es necesario.
    return phone.replace(/\D/g, '');
  }

  private openUrlInNewTab(url: string): void {
    // Validar la URL podría ser una buena práctica aquí, aunque wa.me es conocido.
    window.open(url, '_blank');
  }
}