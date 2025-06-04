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
          @if(isLoading) {
            <div class="loading">
              <p>Cargando citas del día...</p>
            </div>
          } @else if(error) {
            <div class="error">
              <p>{{ error }}</p>
              <button (click)="loadTodayAppointments()" class="retry-btn">Reintentar</button>
            </div>
          } @else if(todayCitas.length > 0) {
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
  public isLoading: boolean = false;
  public error: string = '';
  
  private appointmentsSubscription!: Subscription;

  constructor(
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    // Formatear la fecha de hoy
    this.todayFormatted = this.formatTodayDate();
    
    // Cargar las citas del día
    this.loadTodayAppointments();
  }
  
  ngOnDestroy(): void {
    if (this.appointmentsSubscription) {
      this.appointmentsSubscription.unsubscribe();
    }
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
    if (!appointment.created_at) return false;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const appointmentDate = new Date(appointment.created_at);
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
  
  loadTodayAppointments(): void {
    this.isLoading = true;
    this.error = '';
    
    this.appointmentsSubscription = this.appointmentService.getAllAppointments().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.processAppointments(response.data);
        } else {
          this.error = 'Error al cargar las citas';
          console.error('Error en la respuesta:', response);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Error al conectar con el servidor';
        console.error('Error cargando citas:', error);
      }
    });
  }
}