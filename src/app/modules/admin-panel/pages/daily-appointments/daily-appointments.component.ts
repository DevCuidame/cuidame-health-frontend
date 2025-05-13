import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Appointment } from 'src/app/core/interfaces/appointment.interface';
import { Subscription } from 'rxjs';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { PendingCardComponent } from '../../components/pending-card/pending-card.component';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';

@Component({
  selector: 'app-daily-appointments',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, SearchBarComponent, PendingCardComponent],
  template: `
    <div class="pending-appointments">
      <app-search-bar
        text="Para el día de hoy ({{ todayFormatted }}) hay {{ todayCitasCount }} citas programadas."
        fontWeight="bold"
      ></app-search-bar>

      <div class="main-content">
        <div class="cards-section">
          @if(todayCitas.length > 0) {
            @for (appointment of todayCitas; track appointment.id) {
              <app-pending-card
                [appointment]="appointment"
                [color]="'var(--ion-color-primary)'"
              ></app-pending-card>
            }
          } @else {
            <div class="no-appointments">
              <p>No hay citas programadas para hoy</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./daily-appointments.component.scss'],
})
export class DailyAppointmentsComponent implements OnInit, OnDestroy {
  public allAppointments: Appointment[] = [];
  public todayCitas: Appointment[] = [];
  public todayFormatted: string = '';
  public todayCitasCount: number = 0;
  
  private wsSubscription!: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    // private websocketService: WebsocketService
  ) {}

  ngOnInit() {
    // Formatear la fecha de hoy
    this.todayFormatted = this.formatTodayDate();
    
    // Suscribirse a los cambios de citas desde el WebSocket
    // this.wsSubscription = this.websocketService.connect().subscribe({
    //   next: (data: any) => {
    //     if (data.event === 'all_appointments' && data.appointments) {
    //       if (data.appointments.data) {
    //         this.processAppointments(data.appointments.data);
    //       } else if (Array.isArray(data.appointments)) {
    //         this.processAppointments(data.appointments);
    //       }
    //     } else if (data.event === 'new_appointment' && data.appointment) {
    //       // Si llega una nueva cita, actualizar la lista si es para hoy
    //       const newAppointment = data.appointment as Appointment;
    //       if (this.isAppointmentToday(newAppointment)) {
    //         this.todayCitas = [...this.todayCitas, newAppointment];
    //         this.todayCitasCount = this.todayCitas.length;
    //       }
    //     }
    //   },
    //   error: (error: any) => {
    //     console.error('Error en WebSocket:', error);
    //   }
    // });
    
    // Solicitar todas las citas al conectarse
    this.requestAppointments();
  }
  
  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    // this.websocketService.disconnect();
  }
  
  processAppointments(appointments: Appointment[]): void {
    this.allAppointments = appointments;
    
    // Filtrar las citas de hoy
    this.todayCitas = this.allAppointments.filter(appointment => 
      this.isAppointmentToday(appointment)
    );
    
    this.todayCitasCount = this.todayCitas.length;
  }
  
  isAppointmentToday(appointment: Appointment): boolean {
    if (!appointment.start_time) return false;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const appointmentDate = new Date(appointment.start_time);
      appointmentDate.setHours(0, 0, 0, 0);
      
      return appointmentDate.getTime() === today.getTime();
    } catch (e) {
      console.error('Error comparando fechas:', e);
      return false;
    }
  }
  
  formatTodayDate(): string {
    const today = new Date();
    return today.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  requestAppointments(): void {
    // setTimeout(() => {
    //   this.websocketService.send({
    //     event: 'all_appointments'
    //   });
    // }, 500);
  }
}