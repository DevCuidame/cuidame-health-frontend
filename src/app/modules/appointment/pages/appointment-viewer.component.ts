// patient-appointments-viewer.component.ts
import { Component, OnInit, HostListener, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, ModalController, NavController } from '@ionic/angular';
import { PatientAppointmentDetailModalComponent } from '../components/patient-appointment-detail-modal';
import { Appointment, AppointmentType } from 'src/app/core/interfaces/appointment.interface';
import { Professional } from 'src/app/core/interfaces/professional.interface';
import { AppointmentService } from 'src/app/core/services/appointment/appointment.service';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { AppointmentMainComponent } from 'src/app/shared/components/appointment-main/appointment-main.component';
import { DashboardSidebarComponent } from 'src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { User } from 'src/app/core/interfaces/auth.interface';
import { UserService } from '../../auth/services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-appointments-viewer',
  templateUrl: './appointment-viewer.component.html',
  styleUrls: ['./appointment-viewer.component.scss'],
  imports: [
    IonicModule, 
    CommonModule, 
    ReactiveFormsModule, 
    TabBarComponent,
    DashboardSidebarComponent,
    AppointmentMainComponent
  ],
  providers: [DatePipe],
  standalone: true
})
export class AppointmentViewerComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  professionals: Professional[] = [];
  public user: User | any = null;
  // Eventos para la comunicación entre componentes
  @Output() dateSelected = new EventEmitter<Date>();

  
  filterForm: FormGroup;
  loading = false;
  showCalendarView = true;
  selectedDate = new Date();
  isDesktop = false;
  
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
  private subscriptions: Subscription[] = [];

  
  constructor(
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private modalController: ModalController,
    private navCtrl: NavController,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private cdRef: ChangeDetectorRef,

  ) {
    this.filterForm = this.formBuilder.group({
      professionalId: [''],
      status: ['']
    });
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadPatientAppointments();
    this.loadUser();
  }

  checkScreenSize() {
    this.isDesktop = window.innerWidth >= 992;
  }

  loadUser() {
    const userSub = this.userService.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.cdRef.detectChanges();
      }
    });

    this.subscriptions.push(userSub);
  }

  loadPatientAppointments(): void {
    this.loading = true;
    
    // Obtener todas las citas para tener el historial completo
    this.appointmentService.getAllAppointments().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.appointments = response.data;
          
          // Extraer profesionales únicos de las citas
          const uniqueProfessionals = new Map<number, Professional>();
          this.appointments.forEach(appointment => {
            if (appointment.professional && !uniqueProfessionals.has(appointment.professional.id)) {
              uniqueProfessionals.set(appointment.professional.id, appointment.professional);
            }
          });
          this.professionals = Array.from(uniqueProfessionals.values());
          
          // Aplicar filtros después de cargar los datos
          this.filterAppointments();
        }
      },
      error: (error) => {
        console.error('Error al cargar las citas:', error);
        // Implementar manejo de errores aquí (mostrar mensaje, etc.)
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  
  filterAppointments(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.appointments];
    
    if (filters.professionalId) {
      filtered = filtered.filter(a => {
        // Si es una cita sin asignar, no aplicamos el filtro de profesional
        if (this.isUnassignedAppointment(a) && a.status === 'requested') {
          return true;
        }
        return a.professional_id === parseInt(filters.professionalId);
      });
    }
    
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    // ORDENAR POR PRIORIDAD DE STATUS Y FECHA
    filtered.sort((a, b) => {
      // Definir prioridades de status (menor número = mayor prioridad)
      const statusPriority: { [key: string]: number } = {
        'confirmed': 1,    // Confirmadas primero
        'requested': 2,    // Solicitadas segundo
        'completed': 3,    // Completadas tercero
        'rescheduled': 4,  // Reprogramadas cuarto
        'cancelled': 5,    // Canceladas quinto
        'no-show': 6       // No asistió último
      };
      
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;
      
      // Si tienen diferente prioridad, ordenar por prioridad
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Si tienen la misma prioridad, ordenar por fecha (más próximas primero)
      const dateA = new Date(a.start_time).getTime();
      const dateB = new Date(b.start_time).getTime();
      
      return dateA - dateB;
    });
    
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
      if (this.isUnassignedAppointment(appointment)) {
        return false;
      }
      
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

  selectDate(date: Date) {
    this.selectedDate = date;
    this.dateSelected.emit(date);
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

  // Añadiendo método para manejar citas sin asignación en appointment-viewer.component.ts

  /**
   * Verifica si una cita está sin asignar (sin profesional o con fecha errónea)
   */
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

  /**
   * Obtiene una representación adecuada de la fecha para citas sin asignar
   */
  getDisplayTimeForUnassignedAppointment(appointment: Appointment): string {
    return 'Pendiente de asignación';
  }

  /**
   * Obtiene todas las citas solicitadas sin asignar
   */
  getUnassignedAppointments(): Appointment[] {
    return this.filteredAppointments.filter(appointment => 
      appointment.status === 'requested' && this.isUnassignedAppointment(appointment)
    );
  }

  /**
   * Obtiene el nombre completo del paciente de la cita
   */
  getPatientName(appointment: any): string {
    if (appointment.patient) {
      return `${appointment.patient.nombre} ${appointment.patient.apellido}`;
    }
    return 'Paciente no especificado';
  }

  /**
   * Obtiene información adicional del paciente (documento)
   */
  getPatientInfo(appointment: any): string {
    if (appointment.patient) {
      const tipo = this.getDocumentTypeName(appointment.patient.tipoid);
      return `${tipo}: ${appointment.patient.numeroid}`;
    }
    return '';
  }

  /**
   * Convierte el código de tipo de documento a nombre legible
   */
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

  // Métodos para manejar eventos de los componentes de escritorio
  handleViewToggled(showCalendarView: boolean) {
    this.showCalendarView = showCalendarView;
  }

  handleDateSelected(date: Date) {
    this.selectedDate = date;
  }

  handleAppointmentSelected(appointment: Appointment) {
    this.selectAppointment(appointment);
  }

  handleNewAppointmentRequested() {
    this.openNewAppointmentModal();
  }

  handleMonthChanged(event: {month: number, year: number}) {
    this.currentMonth = event.month;
    this.currentYear = event.year;
  }

hasCompletedAppointments(date: Date): boolean {
  return this.getAppointmentsForDate(date).some(appointment => 
    appointment.status === 'completed'
  );
}

hasConfirmedAppointments(date: Date): boolean {
  return this.getAppointmentsForDate(date).some(appointment => 
    appointment.status === 'confirmed'
  );
}

hasRequestedAppointments(date: Date): boolean {
  return this.getAppointmentsForDate(date).some(appointment => 
    appointment.status === 'requested'
  );
}
}
