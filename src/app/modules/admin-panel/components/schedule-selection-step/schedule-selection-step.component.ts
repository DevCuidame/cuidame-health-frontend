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
        [first_name]="patientData.nombre"
        [last_name]="patientData.apellido"
        [firstTime]="appointmentFirstTime"
        [cityName]="cityName"
        [ticketNumber]="ticketNumber"
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
                <option value="" disabled selected>Seleccione un departamento</option>
                <option *ngFor="let department of departments" [value]="department.id">
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
                <option value="" disabled selected>Seleccione una ciudad</option>
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
  public appointmentFirstTime: boolean = false;
  public availableSchedule: { day: string; date: string; hours: string[] }[] = [];
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
    this.appointmentFirstTime = false;
    this.ticketNumber = '';
    if (
      appointment.location &&
      Array.isArray(appointment.location) &&
      appointment.location.length > 0
    ) {
      this.cityName = appointment.location[0].township_name;
    } else {
      this.cityName = 'No especificada';
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

        // Solo actualizamos la fecha y hora seleccionadas
        const appointment = this.stateService.appointment();
        if (appointment.start_time) {
          this.selectedDate = appointment.start_time;
        }
        if (appointment.start_time) {
          this.selectedTime = appointment.start_time;
        }

        // También actualizamos los datos del doctor si existen
        // if (appointment.professionalData) {
        //   if (appointment.professionalData.user) {
        //     this.doctorName = `${
        //       appointment.professionalData.user.first_name || ''
        //     } ${appointment.professionalData.user.last_name || ''}`.trim();
        //   }

        //   if (appointment.professionalData.consultation_address) {
        //     this.doctorAddress =
        //       appointment.professionalData.consultation_address;
        //   }

        //   if (appointment.professionalData.attention_township_id) {
        //     this.selectedCity = appointment.professionalData.attention_township_id;
        //   }
        // }
      });
    });
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
    const numericCityId = typeof cityId === 'string' ? parseInt(cityId) : cityId;
    
    // Esta función busca el departamento correspondiente para una ciudad ya seleccionada
    // Iterar por cada departamento y comprobar si la ciudad pertenece a él
    let found = false;
    
    this.departments.forEach(department => {
      this.locationService.fetchCitiesByDepartment(department.id);
      this.locationService.cities$.subscribe(cities => {
        if (found) return; // Si ya se encontró, no continuar buscando
        
        const cityExists = cities.some(city => city.id === numericCityId);
        if (cityExists) {
          found = true;
          this.selectedDepartment = department.id;
          this.selectedDepartmentName = department.name;
          
          // Guardar las ciudades y actualizar la selección
          this.cities = cities;
          this.selectedCity = numericCityId;
          
          // Buscar el nombre de la ciudad
          const city = cities.find(c => c.id === numericCityId);
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
    this.locationService.cities$.subscribe(cities => {
      this.cities = cities;
    });
  }

  onDepartmentChange() {
    if (!this.selectedDepartment) return;
    
    
    this.selectedCity = '';
    this.selectedCityName = '';
    
    this.loadCities(this.selectedDepartment);
    
    const department = this.departments.find(d => d.id == this.selectedDepartment);
    if (department) {
      this.selectedDepartmentName = department.name;
    }
    
  }

  onCityChange() {
    
    if (this.selectedCity) {
      const city = this.cities.find(c => c.id == this.selectedCity);
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
      color: 'primary'
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
        if (hour === 18 && minute === '30') continue; //
        hours.push(`${hour.toString().padStart(2, '0')}:${minute}`);
      }
    }
    this.availableHours = hours;
  }

  onCalendarDateSelected(date: string) {
    this.selectedDate = date;
    this.updateAppointmentManual();
  }

  selectTimeSlot(time: string) {
    this.selectedTime = time;
    this.updateAppointmentManual();
  }

  onDateChange(event: any) {
    this.selectedDate = event.target.value;
    this.updateAppointmentManual();
  }

  updateDoctorInfo() {
    this.updateAppointmentManual();
  }

  updateAppointmentManual() {
    // Validar datos antes de actualizar
    if (!this.validateScheduleData()) {
      return;
    }

    // Preparar datos del profesional de forma limpia
    const professionalData = this.prepareProfessionalData();
    
    // Actualizar el appointment con los nuevos datos
    this.stateService.appointment.update((app) => ({
      ...app,
      start_time: this.formatDateTime(this.selectedDate, this.selectedTime),
      end_time: this.formatDateTime(this.selectedDate, this.selectedTime),
      status: this.isAssigningToPendingAppointment ? 'requested' : 'confirmed',
      professional: professionalData,
      professional_id: professionalData?.id || null
    }));

    // Actualizar estado del servicio
    this.stateService.selectHour(this.selectedTime);
    this.stateService.manualDate.set(this.selectedDate);
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
      return false;
    }
    
    if (this.selectedTime && !this.selectedDate) {
      return false;
    }
    
    return true;
  }

  /**
   * Preparar datos del profesional de forma estructurada
   */
  private prepareProfessionalData(): any {
    const currentProfessional = this.stateService.appointment().professional!;
    
    // Si no hay nombre de doctor, mantener datos existentes
    if (!this.doctorName) {
      return currentProfessional;
    }
    
    // Dividir nombre completo en nombre y apellido
    const nameParts = this.doctorName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      ...currentProfessional,
      user: {
        ...currentProfessional.user,
        first_name: firstName,
        last_name: lastName
      },
      consultation_address: this.doctorAddress || '',
      attention_township_id: this.selectedCity ? parseInt(this.selectedCity.toString()) : null
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
      return `${date}T${time}:00`;
    } catch (error) {
      console.error('Error formateando fecha y hora:', error);
      return '';
    }
  }
}