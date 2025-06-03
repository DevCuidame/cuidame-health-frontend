import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import {
  AlertController,
  IonicModule,
  ModalController,
  ToastController,
  AnimationController,
  Animation,
} from '@ionic/angular';
import { Appointment } from 'src/app/core/interfaces/appointment.interface';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';

@Component({
  selector: 'app-patient-appointment-detail-modal',
  template: `
    <div class="modal-backdrop" (click)="dismiss()"></div>

    <div class="modal-container" #modalContainer>
      <div class="modal-drag-indicator"></div>

      <div
        class="modal-content"
        style="    scrollbar-width: none;
"
      >
        <!-- Header con diseño minimalista -->
        <div class="modal-header">
          <button class="close-button" (click)="dismiss()">
            <ion-icon name="close" size="large"></ion-icon>
          </button>

          <div class="header-content">
            <h1 class="modal-title">Detalle de Cita</h1>
            <div class="status-container">
              <div
                class="status-indicator"
                [attr.data-status]="appointment?.status"
              ></div>
              <span class="status-text">{{
                getStatusText(appointment?.status || '')
              }}</span>
            </div>
          </div>
        </div>

        <!-- Contenido principal con scroll suave -->
        <div class="appointment-content" *ngIf="appointment">
          <!-- Tarjeta del profesional con diseño glassmorphism -->
          <div
            class="info-card professional-card"
            [class.unassigned]="isUnassignedAppointment()"
          >
            <div class="card-icon">
              <ion-icon name="medical"></ion-icon>
            </div>
            <div class="card-content">
              <h3 class="card-title">Profesional Médico</h3>
              <div class="card-main-info" *ngIf="!isUnassignedAppointment()">
                Dr. {{ getLocationDoctor() }}
              </div>
              <div
                class="card-main-info pending"
                *ngIf="isUnassignedAppointment()"
              >
                <ion-icon name="time-outline"></ion-icon>
                Pendiente de asignación
              </div>
              <div class="card-subtitle" *ngIf="!isUnassignedAppointment()">
                {{ appointment.professional?.specialty }}
              </div>
            </div>
          </div>

          <!-- Tarjeta de fecha y hora con diseño moderno -->
          <div
            class="info-card datetime-card"
            [class.unassigned]="isUnassignedAppointment()"
          >
            <div class="datetime-visual">
              <div class="calendar-icon">
                <span class="day" *ngIf="!isUnassignedAppointment()">{{
                  appointment.start_time | date : 'dd'
                }}</span>
                <span class="month" *ngIf="!isUnassignedAppointment()">{{
                  appointment.start_time | date : 'MMM'
                }}</span>
                <ion-icon
                  name="calendar-outline"
                  *ngIf="isUnassignedAppointment()"
                ></ion-icon>
              </div>
            </div>
            <div class="datetime-details">
              <h3 class="card-title">Fecha y Hora</h3>
              <div class="datetime-info" *ngIf="!isUnassignedAppointment()">
                <div class="date">
                  {{ appointment.start_time | date : 'EEEE, d MMMM y' }}
                </div>
                <div class="time">
                  <ion-icon name="time-outline"></ion-icon>
                  {{ appointment.start_time | date : 'h:mm a' }} -
                  {{ appointment.end_time | date : 'h:mm a' }}
                </div>
              </div>
              <div
                class="datetime-info pending"
                *ngIf="isUnassignedAppointment()"
              >
                <ion-icon name="hourglass-outline"></ion-icon>
                Por confirmar
              </div>
            </div>
          </div>

          <div
            class="info-card location-card"
            *ngIf="appointment.location && !isUnassignedAppointment()"
          >
            <div class="card-icon location-icon">
              <ion-icon name="location"></ion-icon>
            </div>
            <div class="card-content">
              <h3 class="card-title">Ubicación de la Cita</h3>
              <div class="location-details">
                <div class="location-city">
                  <ion-icon name="business-outline"></ion-icon>
                  <span>{{ getLocationCity() }}</span>
                </div>
                <div class="location-address">
                  <ion-icon name="navigate-outline"></ion-icon>
                  <span>{{ getLocationAddress() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Información adicional con diseño de tarjetas flotantes -->
          <div class="additional-info">
            <!-- Tipo de cita -->
            <div class="mini-card">
              <div class="mini-card-header">
                <ion-icon name="fitness-outline"></ion-icon>
                <span>Tipo de Consulta</span>
              </div>
              <div class="mini-card-content">
                <strong>{{ appointment.appointmentType?.name }}</strong>
                <span class="duration">
                  <ion-icon name="timer-outline"></ion-icon>
                  {{ appointment.appointmentType?.default_duration || '30' }}
                  minutos
                </span>
              </div>
            </div>

            <!-- Información del paciente -->
            <div class="mini-card">
              <div class="mini-card-header">
                <ion-icon name="person-outline"></ion-icon>
                <span>Paciente</span>
              </div>
              <div class="mini-card-content">
                <strong>{{ getPatientName() }}</strong>
                <span class="patient-id">{{ getPatientInfo() }}</span>
              </div>
            </div>

            <!-- Notas si existen -->
            <div class="mini-card full-width" *ngIf="appointment.notes">
              <div class="mini-card-header">
                <ion-icon name="document-text-outline"></ion-icon>
                <span>Notas</span>
              </div>
              <div class="mini-card-content notes">
                {{ appointment.notes }}
              </div>
            </div>
          </div>
          <div
            style="width: 100%; display: flex;justify-content: center;padding: 20px;"
          >
            <button
              *ngIf="
                appointment.status === 'requested' ||
                appointment.status === 'confirmed'
              "
              class="action-button cancel-button"
              (click)="cancelAppointment()"
            >
              <ion-icon name="close-circle"></ion-icon>
              <span>Cancelar Cita</span>
            </button>

            <button
              *ngIf="appointment.status === 'completed'"
              class="action-button review-button"
              (click)="leaveReview()"
            >
              <ion-icon name="star"></ion-icon>
              <span>Calificar</span>
            </button>

            <button
              *ngIf="appointment.status === 'cancelled' && isPastAppointment()"
              class="action-button confirm-button"
              (click)="confirmCancellation()"
            >
              <ion-icon name="checkmark-circle"></ion-icon>
              <span>Entendido</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./patient-appointment-detail-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class PatientAppointmentDetailModalComponent {
  @ViewChild('modalContainer') modalContainer!: ElementRef;

  appointment: any | null = null;
  private modalAnimation: Animation | null = null;

  private modalController = inject(ModalController);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private appointmentService = inject(AppointmentService);
  private animationCtrl = inject(AnimationController);

  ngAfterViewInit() {
    // Añadir animación de entrada personalizada
    if (this.modalContainer) {
      this.modalAnimation = this.animationCtrl
        .create()
        .addElement(this.modalContainer.nativeElement)
        .duration(400)
        .easing('cubic-bezier(0.34, 1.56, 0.64, 1)')
        .fromTo('transform', 'translateY(100%)', 'translateY(0)');
    }
  }

  async dismiss() {
    // Animación de salida
    if (this.modalAnimation) {
      await this.modalAnimation.direction('reverse').play();
    }
    this.modalController.dismiss();
  }

  async cancelAppointment() {
    const alert = await this.alertController.create({
      header: 'Confirmar Cancelación',
      message: '¿Estás seguro que deseas cancelar esta cita?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Sí, cancelar',
          cssClass: 'danger',
          handler: () => {
            this.performCancellation();
          },
        },
      ],
    });

    await alert.present();
  }

  private async performCancellation() {
    const loading = await this.showLoadingToast('Cancelando cita...');

    try {
      const response = await this.appointmentService
        .cancelAppointment(this.appointment.id)
        .toPromise();

      await loading.dismiss();

      if (response && response.success !== false) {
        await this.showSuccessToast('Cita cancelada exitosamente');
        this.appointment.status = 'cancelled';

        await this.dismiss();
        this.modalController.dismiss({
          cancelled: true,
          appointmentId: this.appointment.id,
        });
      } else {
        await this.showErrorToast(
          response?.message || 'Error al cancelar la cita'
        );
      }
    } catch (error) {
      await loading.dismiss();
      await this.showErrorToast('Error de conexión. Intenta nuevamente.');
    }
  }

  private async showLoadingToast(message: string) {
    const toast = await this.toastController.create({
      message,
      position: 'top',
      cssClass: 'loading-toast',
      buttons: [
        {
          icon: 'sync',
          side: 'start',
        },
      ],
    });
    await toast.present();
    return toast;
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom',
      icon: 'checkmark-circle',
      cssClass: 'custom-toast',
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'bottom',
      icon: 'alert-circle',
      cssClass: 'custom-toast',
    });
    await toast.present();
  }

  isUnassignedAppointment(): boolean {
    const appointmentDate = new Date(this.appointment.start_time);
    const today = new Date();
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(today.getFullYear() + 50);

    return appointmentDate > fiftyYearsFromNow;
  }

  async leaveReview() {
    // Implementar lógica de calificación
    const toast = await this.toastController.create({
      message: 'Función de calificación próximamente',
      duration: 2000,
      position: 'bottom',
      color: 'primary',
    });
    await toast.present();
  }

  confirmCancellation() {
    this.dismiss();
  }

  isPastAppointment(): boolean {
    if (!this.appointment) return false;
    return new Date(this.appointment.start_time) < new Date();
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      requested: 'Solicitada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      rescheduled: 'Reprogramada',
      'no-show': 'No asistió',
    };
    return statusMap[status] || status;
  }

  getPatientName(): string {
    if (this.appointment?.patient) {
      return `${this.appointment.patient.nombre} ${this.appointment.patient.apellido}`;
    }
    return 'Familiar no especificado';
  }

  getPatientInfo(): string {
    if (this.appointment?.patient) {
      const tipoId = this.appointment.patient.tipoid;
      const tipos: { [key: string]: string } = {
        cedula_ciudadania: 'CC',
        tarjeta_identidad: 'TI',
        registro_civil: 'RC',
        pasaporte: 'PA',
        cedula_extranjeria: 'CE',
      };
      const tipoNombre = tipos[tipoId] || tipoId;
      return `${tipoNombre}: ${this.appointment.patient.numeroid}`;
    }
    return '';
  }

  private parseLocation(): {
    city: string;
    address: string;
    doctor: string;
  } | null {
    if (!this.appointment?.location) {
      return null;
    }

    const parts = this.appointment.location.split('_');

    if (parts.length >= 2) {
      return {
        city: parts[0] || '',
        address: parts[1] || '',
        doctor: parts[2] || '',
      };
    }

    return null;
  }

  getLocationCity(): string {
    const location = this.parseLocation();
    return location?.city || 'Ciudad no especificada';
  }

  getLocationAddress(): string {
    const location = this.parseLocation();
    return location?.address || 'Dirección no especificada';
  }

  getLocationDoctor(): string {
    const location = this.parseLocation();
    return location?.doctor || '';
  }
}
