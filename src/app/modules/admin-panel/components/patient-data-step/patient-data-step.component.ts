import { Component, effect, inject, Injector, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { identificationOptions } from 'src/app/core/constants/indentifications';
import { ToastService } from 'src/app/core/services/toast.service';
import { PatientSearchService } from 'src/app/core/services/patient-search.service';
import { Subscription } from 'rxjs';
import { AppointmentStateService } from 'src/app/core/services/appointment/appointment-state.service';

@Component({
  selector: 'app-patient-data-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-content">
      <h2>Datos del paciente</h2>

      <!-- Identificación -->
      <div class="form-group">
        <label>Identificación</label>
        <div class="row search-row">
          <select
            [(ngModel)]="appointmentData.userData.identification_type"
            (change)="onIdentificationChange()"
          >
            <option value="">Seleccione</option>
            @for (option of identificationOptions; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <input
            type="text"
            placeholder="#"
            [(ngModel)]="appointmentData.userData.identification_number"
            (ngModelChange)="onIdentificationNumberChange()"
          />

          <button
            type="button"
            class="search-button"
            (click)="searchUser()"
            [disabled]="!canSearch"
          >
            <i class="fas fa-search"></i> Buscar
            <span *ngIf="searchState.loading" class="loading-indicator"></span>
          </button>
        </div>

        <!-- Estado de búsqueda -->
        <div class="search-status">
          <div *ngIf="searchState?.loading" class="status-message loading">
            <i class="fas fa-spinner fa-spin"></i> Buscando usuario...
          </div>
          <div *ngIf="searchState?.notFound" class="status-message not-found">
            <i class="fas fa-exclamation-circle"></i> Usuario no encontrado.
          </div>
          <div *ngIf="searchState?.success" class="status-message success">
            <i class="fas fa-check-circle"></i> Usuario encontrado:
            {{ getFullName() }}
          </div>
          <div *ngIf="searchState?.error" class="status-message error">
            <i class="fas fa-times-circle"></i> Error al buscar el usuario. Por
            favor intente nuevamente.
          </div>
        </div>
      </div>

      <!-- Nombres y apellidos -->
      <div class="form-group">
        <label>Nombres y apellidos</label>
        <input
          type="text"
          [disabled]="true"
          [value]="getFullName()"
        />
      </div>

      <!-- Teléfono y Email -->
      <div class="form-group">
        <div class="row">
          <div class="item">
            <label>Teléfono</label>
            <input
              type="text"
              [disabled]="true"
              [(ngModel)]="appointmentData.userData.phone"
            />
          </div>
          <div class="item">
            <label>E-Mail</label>
            <input
              type="text"
              [disabled]="true"
              [(ngModel)]="appointmentData.userData.email"
            />
          </div>
        </div>
      </div>

      <!-- Tipo de cita -->
      <div class="form-group" style="display: flex; flex-direction: row;">
        <div class="custom-checkbox-container">
          <input
            type="checkbox"
            id="firstTimeCheck"
            [checked]="appointmentData.first_time"
            (change)="toggleSelection('firstTime')"
          />
          <label for="firstTimeCheck"> Cita primera vez </label>
        </div>

        <div class="custom-checkbox-container">
          <input
            type="checkbox"
            id="controlCheck"
            [checked]="appointmentData.control"
            (change)="toggleSelection('control')"
          />
          <label for="controlCheck"> Control </label>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./patient-data-step.component.scss'],
})
export class PatientDataStepComponent implements OnInit {
  public identificationOptions = identificationOptions;
  public appointmentData: any;
  public searchState: any;
  private debounceTimeout: any;
  private subscription: Subscription = new Subscription();
  JSON = JSON;
  private injector = inject(Injector);
  constructor(
    private stateService: AppointmentStateService,
    private patientSearchService: PatientSearchService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Obtener el estado actual del appointment
    this.appointmentData = this.stateService.appointment();
    this.searchState = this.stateService.searchState();

    // Suscribirse a los cambios de estado
    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.searchState = this.stateService.searchState();
        this.appointmentData = this.stateService.appointment();
      });
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get canSearch(): boolean {
    return (
      !!this.appointmentData.userData.identification_type &&
      !!this.appointmentData.userData.identification_number &&
      !this.searchState.loading
    );
  }

  searchUser(): void {
    const idType = this.appointmentData.userData.identification_type;
    const idNumber = this.appointmentData.userData.identification_number;
  
    if (!idType || !idNumber) {
      this.toastService.presentToast(
        'Por favor, ingrese tipo y número de identificación',
        'warning'
      );
      return;
    }
  
    this.patientSearchService
      .searchUserByIdentification(idType, idNumber)
      .subscribe({
        next: (data) => {
          // El servicio ya actualiza el estado, no necesitamos hacer nada más aquí
        },
        error: (error) => {
          this.toastService.presentToast(
            'Error al buscar usuario. Intente nuevamente.',
            'danger'
          );
        },
      });
  }

  onIdentificationChange(): void {
    this.stateService.appointment.update((app) => ({
      ...app,
      // userData: {
      //   ...app.userData,
      //   identification_type: this.appointmentData.userData.identification_type,
      // },
    }));

    this.onIdentificationNumberChange();
  }

  onIdentificationNumberChange(): void {
    // Actualizar el estado
    this.stateService.appointment.update((app) => ({
      ...app,
      // userData: {
      //   ...app.userData,
      //   identification_number:
      //     this.appointmentData.userData.identification_number,
      // },
    }));
    // Limpiar el timeout anterior
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Solo iniciar la búsqueda si hay suficiente información
    if (
      this.appointmentData.userData.identification_type &&
      this.appointmentData.userData.identification_number
    ) {
      this.debounceTimeout = setTimeout(() => {
        this.searchUser();
      }, 500);
    }
  }

  toggleSelection(selected: 'firstTime' | 'control'): void {
    this.stateService.toggleSelectionType(selected);
    this.appointmentData = this.stateService.appointment();
  }

  getFullName(): string {
    const firstName = this.appointmentData.userData.first_name || '';
    const lastName = this.appointmentData.userData.last_name || '';
    return firstName && lastName ? `${firstName} ${lastName}` : '';
  }
}
