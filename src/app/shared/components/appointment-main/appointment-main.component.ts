import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Appointment } from 'src/app/core/interfaces/appointment.interface';
import { Professional } from 'src/app/core/interfaces/professional.interface';

@Component({
  selector: 'app-appointment-main',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="appointment-main-container">
      <!-- Header con título y botones de acción -->
      <div class="main-header">
        <h1>Citas Médicas</h1>
        <div class="header-actions">
          <button class="view-toggle" (click)="toggleView()">
            <ion-icon [name]="showCalendarView ? 'list' : 'calendar'"></ion-icon>
            {{ showCalendarView ? 'Vista de Lista' : 'Vista de Calendario' }}
          </button>
          <button class="new-appointment" (click)="createNewAppointment()">
            <ion-icon name="add-circle-outline"></ion-icon>
            Nueva Cita
          </button>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="main-content">
        <!-- Vista de Calendario -->
        <div class="calendar-view" *ngIf="showCalendarView">
          <div class="calendar-header">
            <button (click)="previousMonth()" class="month-nav">
              <ion-icon name="chevron-back"></ion-icon>
            </button>
            <h2>{{ monthNames[currentMonth] }} {{ currentYear }}</h2>
            <button (click)="nextMonth()" class="month-nav">
              <ion-icon name="chevron-forward"></ion-icon>
            </button>
          </div>

          <div class="calendar-grid">
            <div class="weekday-header">
              <div *ngFor="let day of weekDays" class="weekday">{{ day }}</div>
            </div>

            <div class="days-grid">
              <div
                *ngFor="let date of getDaysInMonth()"
                class="day-cell"
                [class.today]="isToday(date)"
                [class.other-month]="!isSelectedMonth(date)"
                [class.has-appointments]="getAppointmentsForDate(date).length > 0"
                (click)="selectDate(date)"
                [class.selected]="
                  formatDateToCompare(selectedDate) === formatDateToCompare(date)
                "
              >
                <span class="day-number">{{ date.getDate() }}</span>
                <div
                  class="appointment-indicators"
                  *ngIf="getAppointmentsForDate(date).length > 0"
                >
                  <div
                    *ngFor="let appointment of getAppointmentsForDate(date)"
                    class="appointment-dot"
                    [style.background-color]="getStatusColor(appointment.status)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel lateral de detalles -->
        <div class="details-panel">
          <!-- Citas del día seleccionado -->
          <div class="selected-date-appointments" *ngIf="showCalendarView">
            <h3>{{ selectedDate | date : "EEEE, d MMMM" }}</h3>
            <div class="appointments-list" *ngIf="getAppointmentsForDate(selectedDate).length > 0">
              <div
                *ngFor="let appointment of getAppointmentsForDate(selectedDate)"
                class="appointment-card"
                (click)="selectAppointment(appointment)"
              >
                <div class="appointment-header">
                  <div class="time">
                    {{ appointment.start_time | date : "h:mm a" }}
                  </div>
                  <div
                    class="status-badge"
                    [style.background-color]="getStatusColor(appointment.status)"
                  >
                    {{ getStatusText(appointment.status) }}
                  </div>
                </div>
                <div class="appointment-info">
                  <p class="professional-name" *ngIf="!isUnassignedAppointment(appointment)">
                    Dr. {{ appointment?.professional?.user?.name }}
                    {{ appointment?.professional?.user?.lastname }}
                  </p>
                  <p class="professional-name" *ngIf="isUnassignedAppointment(appointment)">
                    Pendiente de asignación
                  </p>
                  <p class="appointment-details">
                    {{ appointment?.appointmentType?.name || "Consulta general" }}
                    <ng-container *ngIf="!isUnassignedAppointment(appointment)">
                      - {{ appointment?.professional?.specialty }}
                    </ng-container>
                  </p>
                  <div class="patient-info">
                    <p class="patient-name">
                      Familiar: {{ getPatientName(appointment) }}
                    </p>
                    <p class="patient-id">{{ getPatientInfo(appointment) }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="no-appointments" *ngIf="getAppointmentsForDate(selectedDate).length === 0">
              <p>No hay citas programadas para este día</p>
            </div>
          </div>

          <!-- Citas sin asignar -->
          <div class="unassigned-appointments-section" *ngIf="getUnassignedAppointments().length > 0">
            <h3>Citas pendientes de asignación</h3>
            <div class="appointments-list">
              <div
                *ngFor="let appointment of getUnassignedAppointments()"
                class="appointment-card"
                (click)="selectAppointment(appointment)"
              >
                <div class="appointment-header">
                  <div class="time">
                    {{ getDisplayTimeForUnassignedAppointment(appointment) }}
                  </div>
                  <div
                    class="status-badge"
                    [style.background-color]="getStatusColor(appointment.status)"
                  >
                    {{ getStatusText(appointment.status) }}
                  </div>
                </div>
                <div class="appointment-info">
                  <p class="professional-name">Pendiente de asignación</p>
                  <p class="appointment-details">
                    {{ appointment?.appointmentType?.name || "Consulta general" }}
                  </p>
                  <div class="patient-info">
                    <p class="patient-name">
                      Familiar: {{ getPatientName(appointment) }}
                    </p>
                    <p class="patient-id">{{ getPatientInfo(appointment) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vista de lista -->
          <div class="list-view" *ngIf="!showCalendarView">
            <h3>Todas las citas</h3>
            <div class="appointments-list">
              <div
                *ngFor="let appointment of appointments"
                class="appointment-card"
                (click)="selectAppointment(appointment)"
              >
                <div class="appointment-header">
                  <div class="date-time">
                    <div class="date" *ngIf="!isUnassignedAppointment(appointment)">
                      {{ appointment.start_time | date : "EEEE, MMM d" }}
                    </div>
                    <div class="date" *ngIf="isUnassignedAppointment(appointment)">
                      Pendiente de asignación
                    </div>
                    <div class="time" *ngIf="!isUnassignedAppointment(appointment)">
                      {{ appointment.start_time | date : "h:mm a" }}
                    </div>
                  </div>
                  <div
                    class="status-badge"
                    [style.background-color]="getStatusColor(appointment.status)"
                  >
                    {{ getStatusText(appointment.status) }}
                  </div>
                </div>
                <div class="appointment-info">
                  <p class="professional-name" *ngIf="!isUnassignedAppointment(appointment)">
                    Dr. {{ appointment?.professional?.user?.name }}
                    {{ appointment?.professional?.user?.lastname }}
                  </p>
                  <p class="professional-name" *ngIf="isUnassignedAppointment(appointment)">
                    Pendiente de asignación
                  </p>
                  <p class="appointment-details">
                    {{ appointment?.appointmentType?.name || "Consulta general" }}
                    <ng-container *ngIf="!isUnassignedAppointment(appointment)">
                      - {{ appointment?.professional?.specialty }}
                    </ng-container>
                  </p>
                  <div class="patient-info">
                    <p class="patient-name">
                      Familiar: {{ getPatientName(appointment) }}
                    </p>
                    <p class="patient-id">{{ getPatientInfo(appointment) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./appointment-main.component.scss']
})
export class AppointmentMainComponent {
  @Input() appointments: Appointment[] = [];
  @Input() filteredAppointments: Appointment[] = [];
  @Input() professionals: Professional[] = [];
  @Input() statusColors: {[key: string]: string} = {};
  @Input() weekDays: string[] = [];
  @Input() monthNames: string[] = [];
  @Input() loading: boolean = false
  @Input() showCalendarView: any
  @Input() currentMonth: number = new Date().getMonth();
  @Input() currentYear: number = new Date().getFullYear();

  
  @Output() viewToggled = new EventEmitter<boolean>();
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() appointmentSelected = new EventEmitter<Appointment>();
  @Output() newAppointmentRequested = new EventEmitter<void>();
  @Output() monthChanged = new EventEmitter<{month: number, year: number}>();

  @Input() selectedDate = new Date();

  toggleView() {
    this.showCalendarView = !this.showCalendarView;
    this.viewToggled.emit(this.showCalendarView);
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.dateSelected.emit(date);
  }

  selectAppointment(appointment: Appointment) {
    this.appointmentSelected.emit(appointment);
  }

  createNewAppointment() {
    this.newAppointmentRequested.emit();
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.monthChanged.emit({month: this.currentMonth, year: this.currentYear});
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.monthChanged.emit({month: this.currentMonth, year: this.currentYear});
  }

  getDaysInMonth(): Date[] {
    const year = this.currentYear;
    const month = this.currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: Date[] = [];
    
    // Add empty days for the start of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(new Date(year, month, -i));
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Reverse the first part to get correct order
    const previousMonthDays = days.slice(0, startingDay).reverse();
    const currentMonthDays = days.slice(startingDay);
    
    return [...previousMonthDays, ...currentMonthDays];
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return this.formatDateToCompare(date) === this.formatDateToCompare(today);
  }

  isSelectedMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth;
  }

  formatDateToCompare(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  getAppointmentsForDate(date: Date): Appointment[] {
    const dateStr = this.formatDateToCompare(date);
    return this.filteredAppointments.filter(appointment => {
      // Si es una cita sin asignar, no la incluimos en ninguna fecha específica del calendario
      if (this.isUnassignedAppointment(appointment)) {
        return false;
      }
      
      const appointmentDateStr = this.formatDateToCompare(new Date(appointment.start_time));
      return appointmentDateStr === dateStr;
    });
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
    return this.statusColors[status] || '#9E9E9E';
  }

  isUnassignedAppointment(appointment: Appointment): boolean {
    if (!appointment.professional) {
      return true;
    }
    
    // Verificar si la fecha está más de 50 años en el futuro (lo que indicaría un error)
    const appointmentDate = new Date(appointment.start_time);
    const today = new Date();
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(today.getFullYear() + 50);
    
    return appointmentDate > fiftyYearsFromNow;
  }

  getDisplayTimeForUnassignedAppointment(appointment: Appointment): string {
    return 'Pendiente de asignación';
  }

  getUnassignedAppointments(): Appointment[] {
    return this.filteredAppointments.filter(appointment => 
      appointment.status === 'requested' && this.isUnassignedAppointment(appointment)
    );
  }

  getPatientName(appointment: any): string {
    if (appointment.patient) {
      return `${appointment.patient.nombre} ${appointment.patient.apellido}`;
    }
    return 'Paciente no especificado';
  }

  getPatientInfo(appointment: any): string {
    if (appointment.patient) {
      const tipo = this.getDocumentTypeName(appointment.patient.tipoid);
      return `${tipo}: ${appointment.patient.numeroid}`;
    }
    return '';
  }

  getDocumentTypeName(tipoId: string): string {
    const documentTypes: {[key: string]: string} = {
      'cedula_ciudadania': 'CC',
      'tarjeta_identidad': 'TI',
      'registro_civil': 'RC',
      'pasaporte': 'PA',
      'cedula_extranjeria': 'CE'
    };
    
    return documentTypes[tipoId] || tipoId;
  }
}