import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { PrimaryCardComponent } from '../primary-card/primary-card.component';
import { AppointmentService } from 'src/app/core/services/appointment.service';

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

  ngOnInit() {}

  edit() {
    this.edit_button = !this.edit_button;
  }

  async confirmCancel() {
    const alert = await this.alertController.create({
      header: 'Confirmar cancelación',
      message: '¿Estás seguro de que deseas cancelar esta cita?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Sí, cancelar',
          handler: () => {
            this.cancelAppointment();
          },
        },
      ],
    });

    await alert.present();
  }

  cancelAppointment() {
    if (!this.appointmentId) return;

    this.appointmentService.cancelAppointment(this.appointmentId).subscribe(
      () => {
        this.edit_button = false;
        this.appointmentCanceled.emit(this.appointmentId);
      },
      (error: any) => {
        console.error('Error al cancelar la cita:', error);
      }
    );
  }
}
