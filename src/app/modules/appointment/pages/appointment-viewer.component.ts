// patient-appointments-viewer.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, ModalController, NavController } from '@ionic/angular';
import { PatientAppointmentDetailModalComponent } from '../components/patient-appointment-detail-modal';
import { Appointment, AppointmentType } from 'src/app/core/interfaces/appointment.interface';
import { Professional } from 'src/app/core/interfaces/professional.interface';



@Component({
  selector: 'app-appointments-viewer',
  templateUrl: './appointment-viewer.component.html',
  styleUrls: ['./appointment-viewer.component.scss'],
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  providers: [DatePipe],
  standalone: true
})
export class AppointmentViewerComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  professionals: Professional[] = [];
  
  filterForm: FormGroup;
  loading = false;
  showCalendarView = true;
  selectedDate = new Date();
  
  // Status colors
  statusColors = {
    requested: '#FFC107',
    confirmed: '#4CAF50',
    completed: '#2196F3',
    cancelled: '#F44336',
    rescheduled: '#9C27B0',
    'no-show': '#795548'
  };
  
  // Days of the week
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Current month and year
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  // Simulating logged-in patient ID
  currentPatientId = 1;
  currentPatientName = 'Juan Pérez';
  
  constructor(
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private modalController: ModalController,
    private navCtrl: NavController
  ) {
    this.filterForm = this.formBuilder.group({
      professionalId: [''],
      status: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadPatientAppointments();
    this.filterAppointments();
  }
  
  loadPatientAppointments(): void {
    // Mock professionals data (only those who have appointments with this patient)
    this.professionals = [
      { id: 1, user: { name: 'Juan', lastname: 'Pérez' }, specialty: 'Medicina General' },
      { id: 2, user: { name: 'María', lastname: 'Rodríguez' }, specialty: 'Pediatría' },
      { id: 3, user: { name: 'Carlos', lastname: 'Gómez' }, specialty: 'Cardiología' }
    ];
    
    // Mock appointment types
    const appointmentTypes = [
      { id: 1, name: 'Consulta General', description: 'Consulta médica general', default_duration: 30, color_code: '#4CAF50' },
      { id: 2, name: 'Control', description: 'Control de tratamiento', default_duration: 20, color_code: '#2196F3' },
      { id: 3, name: 'Urgencia', description: 'Atención urgente', default_duration: 45, color_code: '#F44336' }
    ];
    
    // Generate mock appointments for the current patient
    this.appointments = this.generatePatientAppointments(this.currentPatientId, appointmentTypes);
  }
  
  private generatePatientAppointments(patientId: number, appointmentTypes: AppointmentType[]): Appointment[] {
    const appointments: Appointment[] = [];
    const today = new Date();
    
    // Add some past appointments
    for (let i = 30; i > 0; i--) {
      if (Math.random() > 0.7) { // 30% chance of having an appointment on any given past day
        const professionalIndex = Math.floor(Math.random() * this.professionals.length);
        const typeIndex = Math.floor(Math.random() * appointmentTypes.length);
        
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() - i);
        
        const hour = 8 + Math.floor(Math.random() * 10);
        appointmentDate.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(appointmentDate);
        endTime.setMinutes(endTime.getMinutes() + appointmentTypes[typeIndex].default_duration);
        
        appointments.push({
          id: appointments.length + 1,
          patient_id: patientId,
          professional_id: this.professionals[professionalIndex].id,
          appointment_type_id: appointmentTypes[typeIndex].id,
          start_time: appointmentDate.toISOString(),
          end_time: endTime.toISOString(),
          status: 'completed',
          notes: 'Cita completada satisfactoriamente',
          professional: this.professionals[professionalIndex],
          appointmentType: appointmentTypes[typeIndex]
        });
      }
    }
    
    // Add some future appointments
    for (let i = 1; i <= 60; i++) {
      if (Math.random() > 0.8) { // 20% chance of having an appointment on any given future day
        const professionalIndex = Math.floor(Math.random() * this.professionals.length);
        const typeIndex = Math.floor(Math.random() * appointmentTypes.length);
        
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + i);
        
        const hour = 8 + Math.floor(Math.random() * 10);
        appointmentDate.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(appointmentDate);
        endTime.setMinutes(endTime.getMinutes() + appointmentTypes[typeIndex].default_duration);
        
        const futureStatuses = ['confirmed', 'requested'];
        const statusIndex = Math.floor(Math.random() * futureStatuses.length);
        
        appointments.push({
          id: appointments.length + 1,
          patient_id: patientId,
          professional_id: this.professionals[professionalIndex].id,
          appointment_type_id: appointmentTypes[typeIndex].id,
          start_time: appointmentDate.toISOString(),
          end_time: endTime.toISOString(),
          status: futureStatuses[statusIndex],
          notes: `Cita ${futureStatuses[statusIndex] === 'confirmed' ? 'confirmada' : 'solicitada'}`,
          professional: this.professionals[professionalIndex],
          appointmentType: appointmentTypes[typeIndex]
        });
      }
    }
    
    return appointments.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }
  
  filterAppointments(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.appointments];
    
    if (filters.professionalId) {
      filtered = filtered.filter(a => a.professional_id === parseInt(filters.professionalId));
    }
    
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    this.filteredAppointments = filtered;
  }
  
  async selectAppointment(appointment: Appointment) {
    const modal = await this.modalController.create({
      component: PatientAppointmentDetailModalComponent,
      componentProps: {
        appointment: appointment
      },
      canDismiss: true,
      showBackdrop: true,
      initialBreakpoint: 0.75,
      breakpoints: [0, 0.75, 1]
    });
    
    modal.onDidDismiss().then((result) => {
      if (result.data?.needsRefresh) {
        this.loadPatientAppointments();
        this.filterAppointments();
      }
    });
    
    return await modal.present();
  }
  
  async openNewAppointmentModal() {
    this.navCtrl.navigateForward('chat');
  }
  
  getAppointmentsForDate(date: Date): Appointment[] {
    const dateStr = this.formatDateToCompare(date);
    return this.filteredAppointments.filter(appointment => {
      const appointmentDateStr = this.formatDateToCompare(new Date(appointment.start_time));
      return appointmentDateStr === dateStr;
    });
  }
  
  formatDateToCompare(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
  
  toggleView() {
    this.showCalendarView = !this.showCalendarView;
  }
  
  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }
  
  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
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
    return this.statusColors[status as keyof typeof this.statusColors] || '#9E9E9E';
  }
}
