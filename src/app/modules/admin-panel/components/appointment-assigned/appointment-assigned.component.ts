import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faCrown, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Appointment } from 'src/app/core/interfaces/appointment.interface';
import { ToastService } from 'src/app/core/services/toast.service';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';
import { Specialty } from 'src/app/core/interfaces/appointment.interface';

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
    console.log('AppointmentAssignedComponent initialized with:', {
      isPending: this.isPending,
      isManual: this.isManual,
      patientName: this.patientName,
      professionalName: this.professionalName,
      specialty: this.specialty,
      date: this.date,
      time: this.time,
      dayOfWeek: this.dayOfWeek
    });
    
    // Valores predeterminados para evitar que la plantilla muestre valores vacíos
    if (!this.professionalName && this.appointment?.professional?.user) {
      this.professionalName = `${this.appointment.professional.user.first_name || ''} ${this.appointment.professional.user.last_name || ''}`.trim();
    }
    
    if (!this.specialty && this.appointment?.specialty) {
      this.specialty = this.appointment.specialty;
    }
    
    if (!this.patientName && this.appointment?.patient) {
      this.patientName = `${this.appointment.patient.nombre || ''} ${this.appointment.patient.apellido || ''}`.trim();
    }
  }
  
  getAppointmentTitle(): string {
    if (this.isManual) {
      return 'CITA PENDIENTE POR ASIGNACIÓN';
    } else if (this.isPending) {
      return 'CITA PENDIENTE';
    } else {
      return 'CITA ASIGNADA';
    }
  }
  
  getFormattedDate(): string {
    if (!this.date) return '(fecha por confirmar)';
    
    try {
      const dateObj = new Date(this.date);
      return dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return this.date;
    }
  }
  
  getDoctorLocation(): string {
    if (!this.appointment || !this.appointment.professional) {
      return 'la dirección indicada';
    }
    
    const doctorData = this.appointment.professional;
    const address = doctorData.consultation_address || '';
    const city = doctorData.attention_township_id || '';
    
    if (address && city) {
      return `${address}, ${city}`;
    } else if (address) {
      return address;
    } else if (city) {
      return city;
    } else {
      return 'la dirección indicada';
    }
  }
  
  savePendingAppointment() {
    if (!this.appointment) {
      this.toastService.presentToast('No hay datos de cita para guardar', 'danger');
      return;
    }
    
    const appointmentToSave = {
      ...this.appointment,
      status: 'TO_BE_CONFIRMED'
    };
    
    this.appointmentService.createAppointment(appointmentToSave as Appointment).subscribe({
      next: (response: any) => {
        this.toastService.presentToast('Cita pendiente guardada exitosamente', 'success');
        this.appointmentSaved.emit(true);
      },
      error: (error: any) => {
        console.error('Error al guardar la cita pendiente:', error);
        this.toastService.presentToast('Error al guardar la cita pendiente', 'danger');
        this.appointmentSaved.emit(false);
      }
    });
  }
  
  openWhatsApp() {
    const phone = this.professionalPhone || '573043520351';
    const text = `Hola, me gustaría agendar una cita con ${this.professionalName || 'el profesional'} para la especialidad de ${this.specialty || 'la especialidad seleccionada'}. El nombre del beneficiario es: ${this.patientName || 'el paciente'}.`;
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }
}