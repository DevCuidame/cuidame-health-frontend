import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { IonicModule, ModalController } from "@ionic/angular";
import { Appointment } from "src/app/core/interfaces/appointment.interface";
// Component for patient appointment detail modal
@Component({
    selector: 'app-patient-appointment-detail-modal',
    template: `
      <ion-header>
        <ion-toolbar>
          <ion-title>Detalles de mi Cita</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div class="appointment-detail" *ngIf="appointment">
          <div class="status-tag" [style.background-color]="getStatusColor(appointment.status)">
            {{getStatusText(appointment.status)}}
          </div>
          
          <div class="detail-section">
            <h3>Profesional</h3>
            <p>Dr. {{appointment.professional.user.name}} {{appointment.professional.user.lastname}}</p>
            <p class="detail-info">{{appointment.professional.specialty}}</p>
          </div>
          
          <div class="detail-section">
            <h3>Tipo de Cita</h3>
            <p>{{appointment.appointmentType.name}}</p>
            <p class="detail-info">Duración aproximada: {{appointment.appointmentType.default_duration}} minutos</p>
          </div>
          
          <div class="detail-section">
            <h3>Fecha y Hora</h3>
            <p>{{appointment.start_time | date:'EEEE, d MMMM y'}}</p>
            <p>{{appointment.start_time | date:'h:mm a'}} - {{appointment.end_time | date:'h:mm a'}}</p>
          </div>
          
          <div class="detail-section" *ngIf="appointment.notes">
            <h3>Notas</h3>
            <p>{{appointment.notes}}</p>
          </div>
          
          <div class="action-buttons">
            <ion-button 
              *ngIf="appointment.status === 'requested' || appointment.status === 'confirmed'" 
              color="danger" 
              fill="outline" 
              expand="block"
              (click)="cancelAppointment()">
              <ion-icon name="close-circle" slot="start"></ion-icon>
              Cancelar Cita
            </ion-button>
            
            <ion-button 
              *ngIf="appointment.status === 'cancelled' && isPastAppointment()"
              color="tertiary" 
              fill="outline" 
              expand="block"
              (click)="confirmCancellation()">
              <ion-icon name="checkmark" slot="start"></ion-icon>
              Entendido
            </ion-button>
            
            <ion-button 
              *ngIf="appointment.status === 'completed'" 
              color="success" 
              fill="outline" 
              expand="block"
              (click)="leaveReview()">
              <ion-icon name="star" slot="start"></ion-icon>
              Calificar Atención
            </ion-button>
          </div>
        </div>
      </ion-content>
    `,
    styles: [`
      .appointment-detail {
        padding-bottom: 20px;
      }
      
      .status-tag {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 16px;
        color: white;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 16px;
      }
      
      .detail-section {
        margin-bottom: 16px;
      }
      
      .detail-section h3 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
        color: #666;
      }
      
      .detail-section p {
        margin: 2px 0;
        font-size: 16px;
      }
      
      .detail-info {
        font-size: 14px !important;
        color: #999;
      }
      
      .action-buttons {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    `],
    standalone: true,
    imports: [IonicModule, CommonModule]
  })
  export class PatientAppointmentDetailModalComponent {
    appointment: Appointment | null = null;
    
    constructor(private modalController: ModalController) {}
    
    dismiss() {
      this.modalController.dismiss();
    }
    
    async cancelAppointment() {
      // Show confirmation alert
    //   const alert = await this.modalController.create({
    //     header: 'Confirmar Cancelación',
    //     message: '¿Estás seguro que deseas cancelar esta cita?',
    //     buttons: [
    //       {
    //         text: 'No',
    //         role: 'cancel'
    //       },
    //       {
    //         text: 'Sí, cancelar',
    //         handler: () => {
    //           // Here you would call your API to cancel the appointment
    //           console.log('Cancelling appointment...');
    //           this.dismiss();
    //         }
    //       }
    //     ]
    //   });
      
    //   await alert.present();
    }
    
    async leaveReview() {
      // Navigate to review component or open review modal
      console.log('Opening review form...');
    }
    
    confirmCancellation() {
      this.dismiss();
    }
    
    isPastAppointment(): boolean {
      if (!this.appointment) return false;
      return new Date(this.appointment.start_time) < new Date();
    }
    
    getStatusText(status: string): string {
      switch (status) {
        case 'requested': return 'Solicitada';
        case 'confirmed': return 'Confirmada';
        case 'completed': return 'Completada';
        case 'cancelled': return 'Cancelada';
        case 'rescheduled': return 'Reprogramada';
        case 'no-show': return 'No asistió';
        default: return status;
      }
    }
    
    getStatusColor(status: string): string {
      const colors = {
        requested: '#FFC107',
        confirmed: '#4CAF50',
        completed: '#2196F3',
        cancelled: '#F44336',
        rescheduled: '#9C27B0',
        'no-show': '#795548'
      };
      return colors[status as keyof typeof colors] || '#9E9E9E';
    }
  }