import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientSearchBarComponent } from '../patient-search-bar/patient-search-bar.component';
import { SpecialityCardComponent } from '../specialty-card/speciality-card.component';
import { AppointmentStateService } from 'src/app/core/services/appointment/appointment-state.service';
import { MedicalSpecialtyService } from 'src/app/core/services/medicalSpecialty.service';

@Component({
  selector: 'app-specialty-selection-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PatientSearchBarComponent,
    SpecialityCardComponent,
  ],
  template: `
    <div class="step-content">
      <!-- Barra de búsqueda del paciente para mostrar resumen -->
      <app-patient-search-bar
        [image_path]="patientData.photourl"
        [bs64]="patientData.imagebs64"
        [first_name]="patientData.nombre"
        [last_name]="patientData.apellido"
        [firstTime]="appointmentFirstTime"
        [cityName]="cityName"
        [ticketNumber]="ticketNumber"
        (searchTermChanged)="updateSearchTerm($event)"
      ></app-patient-search-bar>

      <h2>Selecciona la especialidad médica que requieres:</h2>

      <!-- Carrusel de especialidades -->
      <div class="carousel-container">
        <button class="arrow left-arrow" (click)="scrollLeft()">
          &#10094;
        </button>

        <div class="carousel-content" #carouselContent>
          @for (spec of specialties(); track spec.id) {
          <app-speciality-card
            [speciality]="spec.name"
            [image]="spec.image_path"
            [class.selected]="isSelected(spec.id)"
            (click)="selectSpecialty(spec.id)"
          ></app-speciality-card>
          }
        </div>

        <button class="arrow right-arrow" (click)="scrollRight()">
          &#10095;
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./specialty-selection-step.component.scss'],
})
export class SpecialtySelectionStepComponent implements OnInit {
  @ViewChild('carouselContent', { static: false })
  carouselContent!: ElementRef<HTMLDivElement>;

  public patientData: any = {};
  public appointmentFirstTime: boolean = false;
  public ticketNumber: string = '';
  public cityName: string = '';

  constructor(
    private stateService: AppointmentStateService,
    private medicalSpecialtyService: MedicalSpecialtyService
  ) {}

  ngOnInit(): void {
    this.initializePatientData();
    this.loadSpecialtiesIfNeeded();
  }

  /**
   * Inicializar datos del paciente y ubicación
   */
  private initializePatientData(): void {
    const appointment = this.stateService.appointment();
    
    // Validar y asignar datos del paciente
    this.patientData = this.validatePatientData(appointment.patient);
    
    // Obtener nombre de la ciudad
    this.cityName = this.extractCityName(appointment.location);
  }

  /**
   * Validar datos del paciente
   */
  private validatePatientData(patient: any): any {
    if (!patient) {
      return {
        nombre: '',
        apellido: '',
        image: '',
        imagebs64: ''
      };
    }
    
    return {
      nombre: patient.nombre || patient.first_name || '',
      apellido: patient.apellido || patient.last_name || '',
      photourl: patient.image || patient.image || '',
      imagebs64: patient.imagebs64 || patient.image_bs64 || ''
    };
  }

  /**
   * Extraer nombre de la ciudad de los datos de ubicación
   */
  private extractCityName(location: any): string {
    if (!location) {
      return 'No especificada';
    }
    
    // Si es un array
    if (Array.isArray(location) && location.length > 0) {
      return location[0].township_name || 'No especificada';
    }
    
    // Si es un objeto directo
    if (location.township_name) {
      return location.township_name;
    }
    
    return 'No especificada';
  }

  /**
   * Cargar especialidades si no están disponibles
   */
  private loadSpecialtiesIfNeeded(): void {
    if (!this.medicalSpecialtyService.specialties().length) {
      this.medicalSpecialtyService.fetchMedicalSpecialties().subscribe({
        error: (error) => {
          console.error('Error cargando especialidades:', error);
        }
      });
    }
  }

  public specialties = computed(() => {
    const searchTerm = this.stateService.searchTerm().toLowerCase();
    return this.medicalSpecialtyService
      .specialties()
      .filter((spec: any) => spec.name.toLowerCase().includes(searchTerm));
  });

  updateSearchTerm(term: string): void {
    if (typeof term === 'string') {
      this.stateService.updateSearchTerm(term.trim());
    }
  }

  selectSpecialty(specialtyId: number): void {
    if (!this.isValidSpecialtyId(specialtyId)) {
      console.error('ID de especialidad inválido:', specialtyId);
      return;
    }

    const specialty = this.findSpecialtyById(specialtyId);
    if (!specialty) {
      console.error('Especialidad no encontrada:', specialtyId);
      return;
    }

    const index = this.specialties().findIndex(spec => spec.id === specialtyId);
    
    // Actualizar estado de selección
    this.stateService.selectSpecialty(index, specialtyId);
    this.stateService.selectedSpecialtyId.set(specialtyId);
    
    // Actualizar datos de la cita
    this.updateAppointmentSpecialty(specialty);
  }

  /**
   * Validar que el ID de especialidad sea válido
   */
  private isValidSpecialtyId(specialtyId: number): boolean {
    return typeof specialtyId === 'number' && specialtyId > 0;
  }

  /**
   * Buscar especialidad por ID
   */
  private findSpecialtyById(specialtyId: number): any {
    return this.specialties().find(spec => spec.id === specialtyId);
  }

  /**
   * Actualizar datos de especialidad en la cita
   */
  private updateAppointmentSpecialty(specialty: any): void {
    this.stateService.appointment.update((app: any) => ({
      ...app,
      specialty_id: specialty.id,
      specialty: {
        id: specialty.id,
        name: specialty.name,
        image_path: specialty.image_path
      }
    }));
  }

  isSelected(specialtyId: number): boolean {
    return this.stateService.selectedSpecialtyId() === specialtyId;
  }

  /**
   * Desplazar carrusel hacia la izquierda
   */
  scrollLeft(): void {
    this.scrollCarousel(-200);
  }

  /**
   * Desplazar carrusel hacia la derecha
   */
  scrollRight(): void {
    this.scrollCarousel(200);
  }

  /**
   * Método unificado para desplazar el carrusel
   */
  private scrollCarousel(distance: number): void {
    if (!this.carouselContent?.nativeElement) {
      return;
    }

    this.carouselContent.nativeElement.scrollBy({
      left: distance,
      behavior: 'smooth'
    });
  }
}
