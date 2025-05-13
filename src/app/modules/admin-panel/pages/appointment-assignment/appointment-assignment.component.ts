import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  Appointment,
  appointmentCounts,
} from 'src/app/core/interfaces/appointment.interface';
import { PendingCardComponent } from '../../components/pending-card/pending-card.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';

@Component({
  selector: 'app-appointment-assignment',
  imports: [PendingCardComponent, FontAwesomeModule, SearchBarComponent],
  templateUrl: './appointment-assignment.component.html',
  styleUrls: ['./appointment-assignment.component.scss'],
})
export class AppointmentAssignmentComponent implements OnInit, OnDestroy {
  public appointments: Appointment[] = [];
  public appointmentCounts: appointmentCounts = {
    EXPIRED: 0,
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    RESCHEDULED: 0,
  };
  public requests: string = '0 solicitudes';

  private wsSubscription!: Subscription;

  constructor(
    // private websocketService: WebsocketService
) {}

  ngOnInit(): void {
    // Subscribe to WebSocket events
    // this.wsSubscription = this.websocketService.connect().subscribe({
    //   next: (data: any) => {
    //     console.log('Datos recibidos desde WebSocket:', data);
        
    //     if (data.event === 'all_appointments' && data.appointments) {
    //       // Check if appointments data has the expected structure
    //       if (data.appointments.data && data.appointments.counts) {
    //         // Structure with data and counts
    //         this.appointments = data.appointments.data;
    //         this.appointmentCounts = data.appointments.counts;
    //       } else {
    //         // Plain array of appointments without counts
    //         this.appointments = Array.isArray(data.appointments) ? data.appointments : [];
    //         this.updateAppointmentCounts();
    //       }
          
    //       this.updateRequests();
    //       console.log('Citas actualizadas:', this.appointments);
    //       console.log('Contadores:', this.appointmentCounts);
    //     } 
    //     else if (data.event === 'new_appointment' && data.appointment) {
    //       this.appointments.push(data.appointment as Appointment);
    //       // Update counts when a new appointment arrives
    //       const status = data.appointment.status as keyof appointmentCounts;
    //       if (status && this.appointmentCounts[status] !== undefined) {
    //         this.appointmentCounts[status]++;
    //       }
    //       console.log('Nueva cita agregada:', data.appointment);
    //       this.updateRequests();
    //     }
    //   },
    //   error: (error: any) => {
    //     console.error('Error en WebSocket:', error);
    //   },
    //   complete: () => {
    //     console.log('Conexión WebSocket cerrada');
    //   },
    // });

    // The connection is now handled in the service's onopen
  }

  // Calculate counts from appointments array
  updateAppointmentCounts() {
    // Reset counts
    Object.keys(this.appointmentCounts).forEach(key => {
      this.appointmentCounts[key as keyof appointmentCounts] = 0;
    });

    // Count by status
    this.appointments.forEach(appointment => {
      const status = appointment.status as keyof appointmentCounts;
      if (status && this.appointmentCounts[status] !== undefined) {
        this.appointmentCounts[status]++;
      }
    });
  }

  updateRequests() {
    this.requests = this.appointmentCounts.PENDING > 0
      ? `${this.appointmentCounts.PENDING} solicitudes`
      : '0 solicitudes';
  }

  requestAppointments() {
    console.log('Solicitando todas las citas...');
    // this.websocketService.send({
    //   event: 'all_appointments'
    // });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    // this.websocketService.disconnect();
  }
}