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
                Dr. {{ appointment.professional?.user?.name }}
                {{ appointment.professional?.user?.lastname }}
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
  styles: [
    `
      .modal-backdrop {
        background: transparent; /* Elimina el fondo negro */
      }
      :host {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        
        // animation: fadeIn 0.3s ease-out;
      }

      .modal-container {
        position: relative;
        width: 100%;
        max-height: 100vh !important; /* Ocupa toda la altura visible */
        height: 100vh !important; /* Fuerza altura completa */
        border-radius: 0 !important;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 24px 24px 0 0;
        box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-drag-indicator {
        width: 40px;
        height: 4px;
        background: #cbd5e1;
        border-radius: 2px;
        margin: 12px auto;
      }

      .modal-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 150px;
      }

      .modal-header {
        position: relative;
        padding: 20px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
      }

      .close-button {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 12px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

      .close-button ion-icon {
        color: white;
      }

      .header-content {
        margin-right: 60px;
      }

      .modal-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 12px 0;
        letter-spacing: -0.5px;
      }

      .status-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        animation: pulse 2s infinite;
      }

      .status-indicator[data-status='requested'] {
        background: #fbbf24;
      }

      .status-indicator[data-status='confirmed'] {
        background: #34d399;
      }

      .status-indicator[data-status='completed'] {
        background: #60a5fa;
      }

      .status-indicator[data-status='cancelled'] {
        background: #f87171;
      }

      .status-text {
        font-size: 16px;
        font-weight: 500;
        opacity: 0.95;
      }

      .appointment-content {
        padding: 24px;
      }

      .info-card {
        background: white;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        display: flex;
        gap: 20px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .info-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .info-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }

      .info-card:hover::before {
        opacity: 1;
      }

      .info-card.unassigned {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      }

      .card-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .card-icon ion-icon {
        font-size: 28px;
        color: white;
      }

      .card-content {
        flex: 1;
      }

      .card-title {
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .card-main-info {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .card-main-info.pending {
        color: #f59e0b;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .card-subtitle {
        font-size: 15px;
        color: #64748b;
      }

      .datetime-card {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      }

      .datetime-visual {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .calendar-icon {
        width: 60px;
        height: 60px;
        background: white;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .calendar-icon .day {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
      }

      .calendar-icon .month {
        font-size: 12px;
        font-weight: 600;
        color: #6366f1;
        text-transform: uppercase;
      }

      .calendar-icon ion-icon {
        font-size: 32px;
        color: #f59e0b;
      }

      .datetime-details {
        flex: 1;
      }

      .datetime-info .date {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .datetime-info .time {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        color: #64748b;
      }

      .datetime-info.pending {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #f59e0b;
        font-weight: 600;
      }

      .additional-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 24px;
      }

      .mini-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
      }

      .mini-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }

      .mini-card.full-width {
        grid-column: 1 / -1;
      }

      .mini-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #64748b;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .mini-card-header ion-icon {
        font-size: 20px;
        color: #6366f1;
      }

      .mini-card-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mini-card-content strong {
        font-size: 16px;
        color: #1e293b;
      }

      .mini-card-content span {
        font-size: 14px;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .mini-card-content.notes {
        font-size: 15px;
        color: #475569;
        line-height: 1.6;
        font-style: italic;
      }

      .duration ion-icon {
        font-size: 16px;
      }

      .floating-actions {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 20px;
        background: linear-gradient(
          to top,
          rgba(255, 255, 255, 1) 0%,
          rgba(255, 255, 255, 0.95) 100%
        );
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        gap: 12px;
        justify-content: center;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
      }

      .action-button {
        padding: 16px 32px;
        border: none;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .action-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }

      .action-button:active {
        transform: translateY(0);
      }

      .action-button ion-icon {
        font-size: 20px;
      }

      .cancel-button {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #dc2626;
      }

      .cancel-button:hover {
        background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
      }

      .review-button {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        color: #059669;
      }

      .review-button:hover {
        background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
      }

      .confirm-button {
        background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
        color: #4c1d95;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        }
        50% {
          box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.1);
        }
        100% {
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        }
      }

      /* Responsive para pantallas grandes */
      @media (min-width: 768px) {
        :host {
          align-items: center;
        }

        .modal-container {
          border-radius: 24px;
          max-height: 100vh;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      }

      /* Modo oscuro */
      @media (prefers-color-scheme: dark) {
        .modal-container {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }

        .modal-header {
          background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%);
        }

        .info-card {
          background: #1e293b;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .card-title {
          color: #94a3b8;
        }

        .card-main-info {
          color: #f1f5f9;
        }

        .card-subtitle {
          color: #94a3b8;
        }

        .datetime-card {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        }

        .calendar-icon {
          background: #0f172a;
        }

        .mini-card {
          background: #1e293b;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        }

        .mini-card-header {
          color: #94a3b8;
        }

        .mini-card-content strong {
          color: #f1f5f9;
        }

        .mini-card-content span {
          color: #94a3b8;
        }

        .floating-actions {
          background: linear-gradient(
            to top,
            rgba(15, 23, 42, 1) 0%,
            rgba(15, 23, 42, 0.95) 100%
          );
        }
      }
    `,
  ],
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
    if (!this.appointment?.professional) {
      return true;
    }

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
}
