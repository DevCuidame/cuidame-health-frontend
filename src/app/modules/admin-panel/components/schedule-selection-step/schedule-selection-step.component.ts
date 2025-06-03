import {
  Component,
  effect,
  inject,
  Injector,
  Input,
  OnInit,
  runInInjectionContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { PatientSearchBarComponent } from '../patient-search-bar/patient-search-bar.component';
import { LocationService } from 'src/app/modules/auth/services/location.service';
import { CalendarSelectorComponent } from '../calendar-selector/calendar-selector.component';
import { AppointmentStateService } from 'src/app/core/services/appointment/appointment-state.service';
import { ScheduleService } from 'src/app/core/services/schedule.service';

@Component({
  selector: 'app-schedule-selection-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PatientSearchBarComponent,
    CalendarSelectorComponent,
  ],
  template: `
    <div class="step-content">
      <!-- Barra de búsqueda del paciente para mostrar resumen -->
      <app-patient-search-bar
        [image_path]="patientData.photourl"
        [bs64]="patientData.imagebs64"
        [first_name]="patientData.nombre"
        [last_name]="patientData.apellido"
        [appointmentType]="appointmentType"
        [cityName]="cityName"
        [ticketNumber]="ticketNumber"
        [showBar]="false"
      ></app-patient-search-bar>

      <h2>Horario de atención</h2>

      <!-- Contenedor para agenda manual - incluye datos del doctor -->
      <div class="manual-schedule-container">
        <div class="form-group">
          <h3>Información del profesional médico</h3>

          <div class="doctor-info">
            <div class="form-field">
              <label for="doctorName">Nombre del doctor</label>
              <input
                type="text"
                id="doctorName"
                [(ngModel)]="doctorName"
                (change)="updateDoctorInfo()"
                placeholder="Ingrese el nombre completo del doctor"
              />
            </div>

            <div class="form-field">
              <label for="doctorDepartment">Departamento</label>
              <select
                id="doctorDepartment"
                [(ngModel)]="selectedDepartment"
                (change)="onDepartmentChange()"
                class="location-select"
              >
                <option value="" disabled selected>
                  Seleccione un departamento
                </option>
                <option
                  *ngFor="let department of departments"
                  [value]="department.id"
                >
                  {{ department.name }}
                </option>
              </select>
            </div>

            <div class="form-field">
              <label for="doctorCity">Ciudad</label>
              <select
                id="doctorCity"
                [(ngModel)]="selectedCity"
                (change)="onCityChange()"
                class="location-select"
                [disabled]="!selectedDepartment || cities.length === 0"
              >
                <option value="" disabled selected>
                  Seleccione una ciudad
                </option>
                <option *ngFor="let city of cities" [value]="city.id">
                  {{ city.name }}
                </option>
              </select>
            </div>

            <div class="form-field">
              <label for="doctorAddress">Dirección</label>
              <input
                type="text"
                id="doctorAddress"
                [(ngModel)]="doctorAddress"
                (change)="updateDoctorInfo()"
                placeholder="Dirección de consultorio"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Fecha acordada</label>
          <div class="date-selector-container">
            <!-- Selector de calendario personalizado -->
            <app-calendar-selector
              [selectedDate]="selectedDate"
              [minDate]="scheduleService.getTodayFormatted()"
              (dateSelected)="onCalendarDateSelected($event)"
            ></app-calendar-selector>

            <!-- Input de fecha oculto para formularios que requieren un input -->
            <input
              type="date"
              class="date-input visually-hidden"
              [min]="scheduleService.getTodayFormatted()"
              [(ngModel)]="selectedDate"
              (change)="onDateChange($event)"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Hora acordada</label>
          <div class="time-selector-container">
            <div class="time-slots">
              @for (hour of availableHours; track hour) {
              <div
                class="time-slot"
                [class.selected]="selectedTime === hour"
                (click)="selectTimeSlot(hour)"
              >
                {{ hour }}
              </div>
              }
            </div>
          </div>
        </div>

        <div class="manual-note">
          <p>
            <i class="fas fa-info-circle"></i>
            Nota: Si no conoce aún la fecha y hora, puede dejar estos campos
            vacíos y continuar. La cita quedará pendiente por asignar.
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./schedule-selection-step.component.scss'],
})
export class ScheduleSelectionStepComponent implements OnInit {
  @Input() isAssigningToPendingAppointment: boolean = false;

  public patientData: any;
  public appointmentType: string = '';
  public availableSchedule: { day: string; date: string; hours: string[] }[] =
    [];
  public isManualSchedule: boolean = true; // Ahora siempre es manual
  private injector = inject(Injector);

  public selectedDate: string = '';
  public selectedTime: string = '';
  public professionalName: string = '';
  public specialtyName: string = '';
  public ticketNumber: string = '';
  public cityName: string = '';

  // Nuevos campos para información del doctor
  public doctorName: string = '';
  public doctorAddress: string = '';

  // Variables para el sistema de departamento/ciudad
  public departments: any[] = [];
  public cities: any[] = [];
  public selectedDepartment: any = '';
  public selectedCity: any = '';
  public selectedCityName: string = '';
  public selectedDepartmentName: string = '';

  public availableHours: string[] = [];

  constructor(
    private stateService: AppointmentStateService,
    public scheduleService: ScheduleService,
    private locationService: LocationService,
    private toastController: ToastController
  ) {
    this.generateTimeOptions();
  }

  ngOnInit(): void {
    const appointment = this.stateService.appointment();
    this.patientData = appointment.patient;
    this.appointmentType = appointment.appointmentType!.name;
    this.ticketNumber = '';
    if (appointment.location) {
      this.cityName = appointment.location;
    } else {
      this.cityName = 'No especificada';
    }

    // Inicializar la fecha seleccionada con la fecha de hoy si no hay una fecha válida
    if (!this.isValidDate(appointment.start_time)) {
      this.selectedDate = this.scheduleService.getTodayFormatted();
      console.log('Fecha inicializada a hoy:', this.selectedDate);
    } else {
      // Si hay una fecha válida, usarla
      this.selectedDate = this.extractDateFromDateTime(appointment.start_time);
      this.selectedTime = this.extractTimeFromDateTime(appointment.start_time);
      console.log('Fecha existente válida:', this.selectedDate, 'Hora:', this.selectedTime);
    }

    // Extrae información del profesional para mostrar en el modo de asignación
    if (this.isAssigningToPendingAppointment && appointment.professional) {
      this.professionalName = `${
        appointment.professional.user?.first_name || ''
      } ${appointment.professional.user?.last_name || ''}`;
      this.specialtyName =
        appointment.specialty?.name || 'Especialidad no especificada';

      // También inicializamos los campos del doctor si ya existen
      if (appointment.professional.user) {
        this.doctorName = this.professionalName;
      }
      if (appointment.professional.consultation_address) {
        this.doctorAddress = appointment.professional.consultation_address;
      }

      // Inicializar los valores de departamento/ciudad si existen
      if (appointment.professional.attention_township_id) {
        this.selectedCity = appointment.professional.attention_township_id;
      }
    }

    this.availableSchedule =
      this.stateService.selectedProfessionalAvailability();

    // Cargar departamentos
    this.loadDepartments();

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const availability =
          this.stateService.selectedProfessionalAvailability();
        this.availableSchedule = availability || [];

        // Solo actualizamos la fecha y hora seleccionadas si son válidas
        const appointment = this.stateService.appointment();
        if (appointment.start_time && this.isValidDate(appointment.start_time)) {
          this.selectedDate = this.extractDateFromDateTime(appointment.start_time);
          this.selectedTime = this.extractTimeFromDateTime(appointment.start_time);
          console.log('Effect - Fecha actualizada:', this.selectedDate, 'Hora:', this.selectedTime);
        }
      });
    });
  }

  /**
   * Verifica si una fecha es válida (no es una fecha del futuro lejano)
   */
  private isValidDate(dateString: string): boolean {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const currentYear = new Date().getFullYear();
      // Consideramos inválidas las fechas con año mayor a currentYear + 50
      return date.getFullYear() <= currentYear + 50;
    } catch {
      return false;
    }
  }

  /**
   * Extrae la parte de fecha de un datetime string
   */
  private extractDateFromDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return '';
      
      // Formato YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  /**
   * Extrae la parte de hora de un datetime string
   */
  private extractTimeFromDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return '';
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  loadDepartments() {
    this.locationService.fetchDepartments();
    this.locationService.departments$.subscribe((departments) => {
      this.departments = departments;

      // Si ya hay una ciudad seleccionada, encontrar el departamento correspondiente
      if (this.selectedCity) {
        this.findDepartmentForCity(this.selectedCity);
      }
    });
  }

  findDepartmentForCity(cityId: string | number) {
    // Convertir el cityId a número si es string
    const numericCityId =
      typeof cityId === 'string' ? parseInt(cityId) : cityId;

    // Esta función busca el departamento correspondiente para una ciudad ya seleccionada
    // Iterar por cada departamento y comprobar si la ciudad pertenece a él
    let found = false;

    this.departments.forEach((department) => {
      this.locationService.fetchCitiesByDepartment(department.id);
      this.locationService.cities$.subscribe((cities) => {
        if (found) return; // Si ya se encontró, no continuar buscando

        const cityExists = cities.some((city) => city.id === numericCityId);
        if (cityExists) {
          found = true;
          this.selectedDepartment = department.id;
          this.selectedDepartmentName = department.name;

          // Guardar las ciudades y actualizar la selección
          this.cities = cities;
          this.selectedCity = numericCityId;

          // Buscar el nombre de la ciudad
          const city = cities.find((c) => c.id === numericCityId);
          if (city) {
            this.selectedCityName = city.name;
          }

          this.updateDoctorInfo();
        }
      });
    });
  }

  loadCities(departmentId: any) {
    if (!departmentId) return;

    this.locationService.fetchCitiesByDepartment(departmentId);
    this.locationService.cities$.subscribe((cities) => {
      this.cities = cities;
    });
  }

  onDepartmentChange() {
    if (!this.selectedDepartment) return;

    this.selectedCity = '';
    this.selectedCityName = '';

    this.loadCities(this.selectedDepartment);

    const department = this.departments.find(
      (d) => d.id == this.selectedDepartment
    );
    if (department) {
      this.selectedDepartmentName = department.name;
    }
  }

  onCityChange() {
    if (this.selectedCity) {
      const city = this.cities.find((c) => c.id == this.selectedCity);
      if (city) {
        this.selectedCityName = city.name;
      }

      this.updateDoctorInfo();
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'primary',
    });
    toast.present();
  }

  getScheduleTypeLabel(): string {
    return 'Manual';
  }

  generateTimeOptions() {
    const hours = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute of ['00', '30']) {
        if (hour === 18 && minute === '30') continue;
        hours.push(`${hour.toString().padStart(2, '0')}:${minute}`);
      }
    }
    this.availableHours = hours;
  }

  onCalendarDateSelected(date: string) {
    this.selectedDate = date;
    console.log('Fecha seleccionada desde calendario:', date);
    this.updateAppointmentManual();
  }

  selectTimeSlot(time: string) {
    this.selectedTime = time;
    console.log('Hora seleccionada:', time);
    this.updateAppointmentManual();
  }

  onDateChange(event: any) {
    this.selectedDate = event.target.value;
    console.log('Fecha cambiada desde input:', this.selectedDate);
    this.updateAppointmentManual();
  }

  updateDoctorInfo() {
    this.updateAppointmentManual();
  }

  updateAppointmentManual() {
    // Preparar datos del profesional de forma limpia
    const professionalData = this.prepareProfessionalData();
  
    // Crear el datetime solo si tenemos fecha y hora válidas
    const dateTime = this.formatDateTime(this.selectedDate, this.selectedTime);
    
    console.log('Actualizando cita manual:', {
      fecha: this.selectedDate,
      hora: this.selectedTime,
      dateTime: dateTime,
      profesional: professionalData,
      isAssigningToPendingAppointment: this.isAssigningToPendingAppointment
    });
  
    // Actualizar el appointment con los nuevos datos
    this.stateService.appointment.update((app) => {
      const updateData: any = {
        ...app,
        start_time: dateTime,
        end_time: dateTime,
        status: this.determineStatus(),
      };
  
      // Solo actualizar professional si hay datos
      if (professionalData) {
        updateData.professional = professionalData;
        updateData.professional_id = professionalData.id || app.professional_id || null;
      }
  
      return updateData;
    });
  
    // Actualizar estado del servicio
    if (this.selectedTime) {
      this.stateService.selectHour(this.selectedTime);
    }
    if (this.selectedDate) {
      this.stateService.manualDate.set(this.selectedDate);
    }
  }
  
  // Agregar este método para determinar el estado correcto
  private determineStatus(): string {
    if (this.isAssigningToPendingAppointment && this.selectedDate && this.selectedTime) {
      return 'confirmed';
    } else if (this.isAssigningToPendingAppointment) {
      return 'requested';
    }
    return 'TO_BE_CONFIRMED';
  }
  /**
   * Validar que los datos del horario sean válidos
   */
  private validateScheduleData(): boolean {
    // Si no hay fecha ni hora, es válido (cita pendiente)
    if (!this.selectedDate && !this.selectedTime) {
      return true;
    }

    // Si hay fecha, debe haber hora y viceversa
    if (this.selectedDate && !this.selectedTime) {
      console.log('Fecha sin hora seleccionada');
      return false;
    }

    if (this.selectedTime && !this.selectedDate) {
      console.log('Hora sin fecha seleccionada');
      return false;
    }

    return true;
  }

  /**
   * Preparar datos del profesional de forma estructurada
   */
  private prepareProfessionalData(): any {
    const currentProfessional = this.stateService.appointment().professional;
  
    // Si no hay nombre de doctor, no crear objeto profesional
    if (!this.doctorName) {
      return currentProfessional || null;
    }
  
    // Dividir nombre completo en nombre y apellido
    const nameParts = this.doctorName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
  
    // Si no hay profesional actual, crear uno nuevo
    if (!currentProfessional) {
      return {
        id: null,
        user: {
          first_name: firstName,
          last_name: lastName,
        },
        consultation_address: this.doctorAddress || '',
        attention_township_id: this.selectedCity
          ? parseInt(this.selectedCity.toString())
          : null,
        attention_township_name: this.selectedCityName || '',
      };
    }
  
    // Si existe profesional, actualizar sus datos
    return {
      ...currentProfessional,
      user: {
        ...(currentProfessional.user || {}),
        first_name: firstName,
        last_name: lastName,
      },
      consultation_address: this.doctorAddress || currentProfessional.consultation_address || '',
      attention_township_id: this.selectedCity
        ? parseInt(this.selectedCity.toString())
        : currentProfessional.attention_township_id || null,
      attention_township_name: this.selectedCityName || currentProfessional.attention_township_name || '',
    };
  }
  /**
   * Formatear fecha y hora en formato ISO
   */
  private formatDateTime(date: string, time: string): string {
    if (!date || !time) {
      return '';
    }

    try {
      // Asegurarse de que la fecha esté en formato YYYY-MM-DD
      const dateParts = date.split('-');
      if (dateParts.length !== 3) {
        console.error('Formato de fecha inválido:', date);
        return '';
      }

      // Construir el datetime string
      const dateTimeString = `${date}T${time}:00`;
      
      // Validar que sea una fecha válida
      const testDate = new Date(dateTimeString);
      if (isNaN(testDate.getTime())) {
        console.error('DateTime inválido:', dateTimeString);
        return '';
      }

      return dateTimeString;
    } catch (error) {
      console.error('Error formateando fecha y hora:', error);
      return '';
    }
  }
}