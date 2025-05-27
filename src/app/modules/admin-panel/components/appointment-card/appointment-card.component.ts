import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { catchError, EMPTY } from 'rxjs';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';
import { PrimaryCardComponent } from 'src/app/shared/components/primary-card/primary-card.component';

@Component({
  selector: 'app-appointment-card',
  standalone: true,
  imports: [CommonModule, IonicModule, PrimaryCardComponent],
  templateUrl: './appointment-card.component.html',
  styleUrls: ['./appointment-card.component.scss'],
})
export class AppointmentCardComponent implements OnInit {
  @Input() appointmentId!: number;
  @Input() patientName: string = 'Nombre del Paciente';
  @Input() last_name: string = 'Nombre del Profesional';
  @Input() first_name: string = 'Nombre del Profesional';
  @Input() specialty: string = 'Especialidad';
  @Input() doctorName: string = 'Nombre del Doctor';
  @Input() date: string = 'Fecha de la cita';
  @Input() time: string = 'Hora de la cita';
  @Input() dayOfWeek: string = 'Día de la semana';
  @Output() appointmentCanceled: EventEmitter<number> = new EventEmitter();

  public edit_button: boolean = false;

  constructor(
    private alertController: AlertController,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.logInitialState();
  }

  private logInitialState(): void {
  }

  toggleEdit(): void {
    this.edit_button = !this.edit_button;
  }

  async presentCancelConfirm(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Cancelación',
      message: '¿Estás seguro de que deseas cancelar esta cita?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary-button' // Usar clases CSS para estilizar si es necesario
        },
        {
          text: 'Sí, Cancelar',
          cssClass: 'danger-button', // Usar clases CSS para estilizar si es necesario
          handler: () => {
            this.processAppointmentCancellation();
          }
        }
      ]
    });
    await alert.present();
  }

  private processAppointmentCancellation(): void {
    if (!this.appointmentId) {
      console.warn('No se proporcionó un ID de cita para cancelar.');
      // Considerar mostrar un toast al usuario aquí
      return;
    }

    this.appointmentService.cancelAppointment(this.appointmentId)
      .pipe(
        catchError(error => {
          this.handleCancellationError(error);
          return EMPTY; // Devuelve un observable vacío para manejar el error
        })
      )
      .subscribe(() => {
        this.handleCancellationSuccess();
      });
  }

  private handleCancellationSuccess(): void {
    this.edit_button = false;
    this.appointmentCanceled.emit(this.appointmentId);
    // Considerar mostrar un toast de éxito al usuario aquí
    console.log(`Cita ${this.appointmentId} cancelada exitosamente.`);
  }

  private handleCancellationError(error: any): void {
    console.error(`Error al cancelar la cita ${this.appointmentId}:`, error);
    // Considerar mostrar un toast de error al usuario aquí
  }
}
