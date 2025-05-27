import { environment } from './../../../../../environments/environment';
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
  @Input() color: string = '';
  @Input() appointment!: Appointment;
  public environment = environment.url;

  public buttonBackground: string = 'assets/background/button_primary_bg.png';
  public confirmButtonBackground: string =
    'assets/background/primary_button_bg.svg';
  public faClock = faClock;
  public faCalendar = faCalendar;
  public faEllipsisV = faEllipsisV;

  public showStatusMenu = false;
  public statusUpdating = false;
  public originalStatus = '';

  constructor(
    private router: Router,
    private appointmentService: AppointmentService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Guardar el estado original para poder revertirlo en caso de error
    this.originalStatus = this.appointment.status;
  }

  toggleStatusMenu(event: Event) {
    event.stopPropagation();
    this.showStatusMenu = !this.showStatusMenu;

    // Cerrar el menú si se hace clic fuera de él
    if (this.showStatusMenu) {
      setTimeout(() => {
        const closeClickHandler = () => {
          this.showStatusMenu = false;
          document.removeEventListener('click', closeClickHandler);
        };
        document.addEventListener('click', closeClickHandler);
      }, 0);
    }
  }

  updateStatus(newStatus: any) {
    if (this.statusUpdating || this.appointment.status === newStatus) {
      this.showStatusMenu = false;
      return;
    }

    this.statusUpdating = true;
    const previousStatus = this.appointment.status;

    this.appointment.status = newStatus;
    this.showStatusMenu = false;

    this.appointmentService
      .updateAppointmentStatus(this.appointment.id, newStatus)
      .subscribe({
        next: (response) => {
          this.statusUpdating = false;
          if (response && response.statusCode === 200) {
            this.toastService.presentToast(
              `Estado actualizado a "${this.getStatusLabel()}"`,
              'success'
            );
            // Si es necesario, actualizar la lista completa
            if (['CANCELLED', 'EXPIRED'].includes(newStatus)) {
              this.appointmentService.getAppointmentsList();
            }
          } else {
            this.handleUpdateError(previousStatus);
          }
        },
        error: (err) => {
          this.handleUpdateError(previousStatus);
        },
      });
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

  handleUpdateError(previousStatus: any) {
    this.statusUpdating = false;
    this.appointment.status = previousStatus;
    this.toastService.presentToast(
      'Error al actualizar el estado. Intente nuevamente.',
      'danger'
    );
  }

  getClockColor(appointment: Appointment): string {
    const createdAt = new Date(appointment.created_at).getTime();
    const expirationTime = createdAt + 2 * 60 * 60 * 1000;
    const now = Date.now();

    if (now >= expirationTime) {
      return 'var(--ion-color-danger)';
    }
    const remaining = expirationTime - now;
    if (remaining <= 30 * 60 * 1000) {
      return 'var(--ion-color-secondary)';
    }
    return 'var(--ion-color-primary)';
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

  getStatusLabel(): string {
    switch (this.appointment.status) {
      case 'requested':
        return 'Solicitada';
      case 'confirmed':
        return 'Confirmada';
      case 'rescheduled':
        return 'Reagendada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return 'Desconocido';
    }
  }

  needsScheduleAssignment(): boolean {
    if (!this.appointment.start_time) {
      return true;
    }
  
    try {
      const appointmentDate = new Date(this.appointment.start_time);
      const today = new Date();
      const fiftyYearsFromNow = new Date();
      fiftyYearsFromNow.setFullYear(today.getFullYear() + 50);
  
      return appointmentDate > fiftyYearsFromNow;
    } catch (error) {
      return true;
    }
  }

  // Formatea la fecha para mostrarse de manera amigable
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return dateStr;
    }
  }

  // En pending-card.component.ts, agrega este método:

getPatientStatusClass(): string {
  const baseClass = 'patient-status';
  
  switch (this.appointment.status) {
    case 'requested':
      return `${baseClass} status-requested`;
    case 'confirmed':
      return `${baseClass} status-confirmed`;
    case 'rescheduled':
      return `${baseClass} status-rescheduled`;
    case 'cancelled':
      return `${baseClass} status-cancelled`;
    case 'completed':
      return `${baseClass} status-completed`;
    default:
      return baseClass;
  }
}

getPatientStatusColor(): string {
  switch (this.appointment.status) {
    case 'requested':
      return '#ffc107'; // Amarillo
    case 'confirmed':
      return '#28a745'; // Verde
    case 'rescheduled':
      return '#17a2b8'; // Azul claro
    case 'cancelled':
      return '#dc3545'; // Rojo
    case 'completed':
      return '#6c757d'; // Gris
    default:
      return '#00c292'; // Color por defecto
  }
}

  // Navega a la página de asignación de cita
  goToAppointment(appointment: Appointment) {
    if (!appointment) {
      console.error('Error: appointment no está definido.');
      return;
    }

    localStorage.setItem('selectedAppointment', JSON.stringify(appointment));
    this.router.navigate(['/admin-panel/dash/pending'], {
      state: { appointment },
    });
  }

  // Navega a la página de asignación de horario para citas pendientes por confirmar
  assignSchedule(appointment: Appointment) {
    if (!appointment) {
      console.error('Error: appointment no está definido.');
      return;
    }

    // Podemos usar la misma ruta pero con un query param para indicar que es asignación de horario
    localStorage.setItem('selectedAppointment', JSON.stringify(appointment));
    this.router.navigate(['/admin-panel/dash/pending'], {
      state: {
        appointment,
        scheduleAssignment: true, // Flag para indicar que es asignación de horario
      },
    });
  }

  // Confirma una cita que ya tiene fecha y hora asignadas
  async confirmAppointment(appointment: Appointment) {
    const alert = await this.alertController.create({
      header: 'Confirmar cita',
      message: `¿Está seguro que desea confirmar la cita para ${this.formatDate(
        appointment.start_time
      )} a las ${appointment.start_time}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            // Actualizar estado de la cita
            const updatedAppointment = {
              ...appointment,
              status: 'CONFIRMED',
            };

            this.appointmentService
              .updateAppointment(
                appointment.id,
                updatedAppointment as Appointment
              )
              .subscribe({
                next: (response) => {
                  if (response && response.statusCode === 200) {
                    this.toastService.presentToast(
                      'Cita confirmada exitosamente',
                      'success'
                    );
                    // Emitir evento o recargar datos
                  } else {
                    this.toastService.presentToast(
                      'Error al confirmar la cita',
                      'danger'
                    );
                  }
                },
                error: (error) => {
                  console.error('Error al confirmar cita:', error);
                  this.toastService.presentToast(
                    'Error al confirmar la cita',
                    'danger'
                  );
                },
              });
          },
        },
      ],
    });

    await alert.present();
  }
}
