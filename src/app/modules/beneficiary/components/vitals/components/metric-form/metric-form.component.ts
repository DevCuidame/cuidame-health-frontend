// src/app/modules/beneficiary/components/vitals/components/metric-form/metric-form.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetricsService } from 'src/app/core/services/Metrics/metrics.service';
import { CommonModule } from '@angular/common';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';

@Component({
  selector: 'app-metric-form',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Agregar {{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <div class="form-container">
      <form [formGroup]="metricForm" (ngSubmit)="onSubmit()">
        <!-- Presión Arterial -->
        <ng-container *ngIf="title === 'Presión Arterial'">
          <div class="carousel-container">
            <div class="m-labels">
              <div class="carousel-label">Sistólica (mmHg)</div>
              <div class="carousel-label">Diastólica (mmHg)</div>
            </div>
            <div class="pickers">
              <ion-input
                type="number"
                formControlName="systolic"
                aria-label="Sistólica"
                min="0"
                max="300"
                placeholder="120"
              ></ion-input>
              <ion-input
                type="number"
                formControlName="diastolic"
                aria-label="Diastólica"
                min="0"
                max="200"
                placeholder="80"
              ></ion-input>
            </div>
            <div class="validation-error" *ngIf="metricForm.get('systolic')?.invalid && metricForm.get('systolic')?.touched">
              Valor sistólico inválido
            </div>
            <div class="validation-error" *ngIf="metricForm.get('diastolic')?.invalid && metricForm.get('diastolic')?.touched">
              Valor diastólico inválido
            </div>
          </div>
        </ng-container>

        <!-- Frecuencia Cardiaca o Respiratoria -->
        <ng-container *ngIf="title === 'Frecuencia Cardiaca' || title === 'Frecuencia Respiratoria'">
          <div class="carousel-container">
            <div class="carousel-label">
              {{ title === "Frecuencia Cardiaca" ? "Ritmo Cardiaco (ppm)" : "Frecuencia Respiratoria (rpm)" }}
            </div>
            <div class="carousel">
              <ion-input
                type="number"
                formControlName="rate"
                [min]="getMinValue()"
                [max]="getMaxValue()"
                [placeholder]="getPlaceholder()"
              ></ion-input>
            </div>
            <div class="validation-error" *ngIf="metricForm.get('rate')?.invalid && metricForm.get('rate')?.touched">
              Valor inválido
            </div>
          </div>
        </ng-container>

        <!-- Glucosa en la Sangre -->
        <ng-container *ngIf="title === 'Glucosa en la Sangre'">
          <div class="carousel-container">
            <div class="carousel-label">{{ title }} (mg/dL)</div>
            <div class="carousel">
              <ion-input
                type="number"
                formControlName="rate"
                min="20"
                max="600"
                placeholder="100"
              ></ion-input>
            </div>
            <div class="validation-error" *ngIf="metricForm.get('rate')?.invalid && metricForm.get('rate')?.touched">
              Valor inválido
            </div>
          </div>
        </ng-container>

        <!-- Oxígeno en la sangre -->
        <ng-container *ngIf="title === 'Oxigeno en la sangre'">
          <div class="carousel-container">
            <div class="carousel-label">{{ title }} (%)</div>
            <div class="carousel">
              <ion-input
                type="number"
                formControlName="rate"
                min="50"
                max="100"
                placeholder="96"
              ></ion-input>
            </div>
            <div class="validation-error" *ngIf="metricForm.get('rate')?.invalid && metricForm.get('rate')?.touched">
              Valor inválido
            </div>
          </div>
        </ng-container>

        <!-- Campos de fecha y hora comunes para todos -->
        <div class="datetime-container">
          <div class="m-labels">
            <div class="m-label">Fecha</div>
            <div class="m-label">Hora</div>
          </div>
          <div class="datetime-picker">
            <input
              type="date"
              formControlName="date"
              [max]="todayDate"
            />
            <input
              type="time"
              formControlName="time"
            />
          </div>
          <div class="validation-error" *ngIf="metricForm.get('date')?.invalid && metricForm.get('date')?.touched">
            Fecha inválida
          </div>
          <div class="validation-error" *ngIf="metricForm.get('time')?.invalid && metricForm.get('time')?.touched">
            Hora inválida
          </div>
        </div>

        <div class="button-container">
          <button type="submit" class="submit-button" [disabled]="metricForm.invalid">Guardar</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      height: 100%;
      justify-content: center;
    }
    
    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 500px;
    }
    
    .carousel-container {
      width: 100%;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .carousel-label {
      margin-bottom: 10px;
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--ion-color-dark);
    }
    
    .carousel {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .m-labels {
      display: flex;
      gap: 20px;
      color: var(--ion-color-dark);
      padding: 0 5px;
    }
    
    .m-label {
      flex: 1;
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .pickers {
      display: flex;
      gap: 10px;
    }
    
    ion-input {
      display: flex;
      width: 100%;
      align-items: center;
      position: relative;
      background: #fff;
      margin-top: 10px;
      border-radius: 100px;
      border: 1px solid #d8e7ee;
      font-size: 16px;
      box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
      padding: 12px;
      --padding-start: 12px;
    }
    
    .datetime-container {
      width: 100%;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .datetime-picker {
      display: flex;
      justify-content: space-around;
      gap: 20px;
    }
    
    input[type="date"],
    input[type="time"] {
      display: flex;
      width: 100%;
      align-items: center;
      background: #fff;
      margin-top: 10px;
      border-radius: 100px;
      border: 1px solid #d8e7ee;
      font-size: 15px;
      box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
      padding: 12px;
    }
    
    .submit-button {
      padding: 15px;
      font-size: 16px;
      font-weight: bold;
      background: linear-gradient(90deg, #ffba52 0%, #ff6a00 100%);
      color: white;
      border: none;
      border-radius: 30px;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
    }
    
    .submit-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .submit-button:active {
      transform: scale(0.98);
    }
    
    .validation-error {
      color: var(--ion-color-danger);
      font-size: 12px;
      margin-top: 5px;
      text-align: center;
    }
    
    .button-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
    }
  `]
})
export class MetricFormComponent implements OnInit {
  @Input() title: string = '';
  metricForm: FormGroup;
  todayDate: string = new Date().toISOString().split('T')[0];
  activeBeneficiary: Beneficiary | null = null;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private metricsService: MetricsService,
    private beneficiaryService: BeneficiaryService,
    private toastService: ToastService
  ) {
    this.metricForm = this.fb.group({
      patient_id: [null, Validators.required],
      systolic: [''],
      diastolic: [''],
      rate: [''],
      date: [this.todayDate, Validators.required],
      time: [new Date().toTimeString().split(' ')[0].slice(0, 5), Validators.required],
    });
  }

  ngOnInit() {
    // Obtener el beneficiario activo para establecer el patient_id
    this.beneficiaryService.activeBeneficiary$.subscribe(beneficiary => {
      this.activeBeneficiary = beneficiary;
      if (beneficiary) {
        this.metricForm.patchValue({
          patient_id: beneficiary.id
        });
      }
    });

    // Configurar validadores específicos según el tipo de métrica
    this.setupValidators();
  }

  setupValidators() {
    if (this.title === 'Presión Arterial') {
      this.metricForm.get('systolic')?.setValidators([
        Validators.required, 
        Validators.min(60),
        Validators.max(250)
      ]);
      this.metricForm.get('diastolic')?.setValidators([
        Validators.required,
        Validators.min(40),
        Validators.max(150)
      ]);
    } else if (this.title === 'Frecuencia Cardiaca') {
      this.metricForm.get('rate')?.setValidators([
        Validators.required,
        Validators.min(30),
        Validators.max(220)
      ]);
    } else if (this.title === 'Frecuencia Respiratoria') {
      this.metricForm.get('rate')?.setValidators([
        Validators.required,
        Validators.min(8),
        Validators.max(40)
      ]);
    } else if (this.title === 'Glucosa en la Sangre') {
      this.metricForm.get('rate')?.setValidators([
        Validators.required,
        Validators.min(20),
        Validators.max(600)
      ]);
    } else if (this.title === 'Oxigeno en la sangre') {
      this.metricForm.get('rate')?.setValidators([
        Validators.required,
        Validators.min(50),
        Validators.max(100)
      ]);
    }

    // Actualiza la validez del formulario
    this.metricForm.updateValueAndValidity();
  }

  getMinValue(): number {
    switch(this.title) {
      case 'Frecuencia Cardiaca': return 30;
      case 'Frecuencia Respiratoria': return 8;
      case 'Glucosa en la Sangre': return 20;
      case 'Oxigeno en la sangre': return 50;
      default: return 0;
    }
  }

  getMaxValue(): number {
    switch(this.title) {
      case 'Frecuencia Cardiaca': return 220;
      case 'Frecuencia Respiratoria': return 40;
      case 'Glucosa en la Sangre': return 600;
      case 'Oxigeno en la sangre': return 100;
      default: return 999;
    }
  }

  getPlaceholder(): string {
    switch(this.title) {
      case 'Frecuencia Cardiaca': return '75';
      case 'Frecuencia Respiratoria': return '16';
      case 'Glucosa en la Sangre': return '100';
      case 'Oxigeno en la sangre': return '96';
      default: return '';
    }
  }

  dismiss(reload: boolean = false) {
    this.modalController.dismiss({ reload });
  }

  onSubmit() {
    if (this.metricForm.valid && this.activeBeneficiary) {
      const metricData = this.metricForm.value;
      const dateTime = new Date(`${metricData.date}T${metricData.time}:00`);
      
      const dataToSubmit = {
        ...metricData,
        date: dateTime.toISOString(),
      };
      
      let serviceCall;
      
      switch (this.title) {
        case 'Presión Arterial':
          serviceCall = this.metricsService.addBloodPressureData(dataToSubmit);
          break;
        case 'Frecuencia Cardiaca':
          serviceCall = this.metricsService.addHeartRateData(dataToSubmit);
          break;
        case 'Frecuencia Respiratoria':
          serviceCall = this.metricsService.addRespiratoryRateData(dataToSubmit);
          break;
        case 'Glucosa en la Sangre':
          serviceCall = this.metricsService.addBloodGlucoseData(dataToSubmit);
          break;
        case 'Oxigeno en la sangre':
          serviceCall = this.metricsService.addBloodOxygenData(dataToSubmit);
          break;
        default:
          this.toastService.presentToast('Tipo de métrica no reconocido', 'danger');
          return;
      }
      
      serviceCall.subscribe(
        (response) => {
          this.toastService.presentToast('Datos guardados correctamente', 'success');
          this.dismiss(true);
        },
        (error) => {
          console.error('Error al guardar datos:', error);
          this.toastService.presentToast('Error al guardar los datos', 'danger');
        }
      );
    } else {
      this.toastService.presentToast('Por favor complete todos los campos requeridos', 'warning');
    }
  }
}