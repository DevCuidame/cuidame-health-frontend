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

  public patientData: any;
  public appointmentFirstTime: boolean = false;
  public ticketNumber: string = '';
  public cityName: string = '';

  constructor(
    private stateService: AppointmentStateService,
    private medicalSpecialtyService: MedicalSpecialtyService
  ) {}

  ngOnInit(): void {
    const appointment = this.stateService.appointment();
    this.patientData = appointment.patient;
    if (
      appointment.location &&
      Array.isArray(appointment.location) &&
      appointment.location.length > 0
    ) {
      this.cityName = appointment.location[0].township_name;
    } else {
      this.cityName = 'No especificada';
    }

    if (!this.medicalSpecialtyService.specialties().length) {
      this.medicalSpecialtyService.fetchMedicalSpecialties().subscribe();
    }
  }

  public specialties = computed(() => {
    const searchTerm = this.stateService.searchTerm().toLowerCase();
    return this.medicalSpecialtyService
      .specialties()
      .filter((spec: any) => spec.name.toLowerCase().includes(searchTerm));
  });

  updateSearchTerm(term: string): void {
    this.stateService.updateSearchTerm(term);
  }

  selectSpecialty(specialtyId: number): void {
    const index = this.specialties().findIndex(
      (spec: any) => spec.id === specialtyId
    );

    if (index !== -1) {
      this.stateService.selectSpecialty(index, specialtyId);

      this.loadProfessionals(specialtyId);
    }
  }

  loadProfessionals(specialtyId: number): void {
    this.stateService.selectedSpecialtyId.set(specialtyId);

    const selectedSpecialty = this.specialties().find(
      (spec: any) => spec.id === specialtyId
    );

    this.stateService.appointment.update((app: any) => ({
      ...app,
      specialty_id: specialtyId.toString(),
      specialty: selectedSpecialty?.name || '',
    }));
  }

  isSelected(specialtyId: number): boolean {
    return this.stateService.selectedSpecialtyId() === specialtyId;
  }

  scrollLeft(): void {
    if (this.carouselContent) {
      this.carouselContent.nativeElement.scrollBy({
        left: -200,
        behavior: 'smooth',
      });
    }
  }

  scrollRight(): void {
    if (this.carouselContent) {
      this.carouselContent.nativeElement.scrollBy({
        left: 200,
        behavior: 'smooth',
      });
    }
  }
}
