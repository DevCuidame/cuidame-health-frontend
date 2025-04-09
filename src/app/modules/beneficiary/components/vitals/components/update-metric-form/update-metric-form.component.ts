// src/app/modules/beneficiary/components/vitals/components/update-metric-form/update-metric-form.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetricsService } from 'src/app/core/services/Metrics/metrics.service';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-update-metric-form',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
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
              ></ion-input>
              <ion-input
                type="number"
                formControlName="diastolic"
                aria-label="Diastólica"
                min="0"
                max="200"
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
          <button type="submit" class="submit-button" [disabled]="metricForm.invalid">Actualizar</button>
          <button type="button" class="delete-button" (click)="onDelete()">Eliminar</button>
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
    
    .button-container {
      width: 100%;
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    
    .submit-button, .delete-button {
      padding: 15px;
      font-size: 16px;
      font-weight: bold;
      border: none;
      border-radius: 30px;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s ease;
    }
    
    .submit-button {
      background: linear-gradient(90deg, #4fd1c5 0%, #2b6cb0 100%);
      color: white;
    }
    
    .delete-button {
      background: linear-gradient(90deg, #ffba52 0%, #ff6a00 100%);
      color: white;
    }
    
    .submit-button:disabled, .delete-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .submit-button:active, .delete-button:active {
      transform: translateY(2px);
    }
    
    .validation-error {
      color: var(--ion-color-danger);
      font-size: 12px;
      margin-top: 5px;
      text-align: center;
    }
  `]
})
export class UpdateMetricFormComponent implements OnInit {
  @Input() title: string = '';
  @Input() data: any;
  metricForm: FormGroup;
  todayDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private metricsService: MetricsService,
    private toastService: ToastService,
    private alertController: AlertController
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
    if (this.data) {
      // Convertir la fecha a formato local para la visualización
      const date = new Date(this.data.date);
      const localDate = date.toISOString().split('T')[0];
      const localTime = date.toTimeString().split(' ')[0].slice(0, 5);
      
      // Inicializar el formulario con los datos existentes
      this.metricForm.patchValue({
        patient_id: this.data.patient_id,
        systolic: this.data.systolic,
        diastolic: this.data.diastolic,
        rate: this.data.rate,
        date: localDate,
        time: localTime,
      });
    }

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

  dismiss(reload: boolean = false) {
    this.modalController.dismiss({ reload });
  }

  onSubmit() {
    if (this.metricForm.valid) {
      const metricData = this.metricForm.value;
      const dateTime = new Date(`${metricData.date}T${metricData.time}:00`);
      
      const dataToSubmit = {
        ...metricData,
        date: dateTime.toISOString(),
      };
      
      let serviceCall;
      
      switch (this.title) {
        case 'Presión Arterial':
          serviceCall = this.metricsService.updateBloodPressureData(dataToSubmit, this.data.id);
          break;
        case 'Frecuencia Cardiaca':
          serviceCall = this.metricsService.updateHeartRateData(dataToSubmit, this.data.id);
          break;
        case 'Frecuencia Respiratoria':
          serviceCall = this.metricsService.updateRespiratoryRateData(dataToSubmit, this.data.id);
          break;
        case 'Glucosa en la Sangre':
          serviceCall = this.metricsService.updateBloodGlucoseData(dataToSubmit, this.data.id);
          break;
        case 'Oxigeno en la sangre':
          serviceCall = this.metricsService.updateBloodOxygenData(dataToSubmit, this.data.id);
          break;
        default:
          this.toastService.presentToast('Tipo de métrica no reconocido', 'danger');
          return;
      }
      
      serviceCall.subscribe(
        () => {
          this.toastService.presentToast('Datos actualizados correctamente', 'success');
          this.dismiss(true);
        },
        (error) => {
          console.error('Error al actualizar datos:', error);
          this.toastService.presentToast('Error al actualizar los datos', 'danger');
        }
      );
    } else {
      this.toastService.presentToast('Por favor complete todos los campos requeridos', 'warning');
    }
  }

  async onDelete() {
    const alert = await this.alertController.create({
      header: '¿Estás seguro?',
      message: 'Esta acción eliminará permanentemente el registro de la métrica.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteMetric();
          }
        }
      ]
    });

    await alert.present();
  }

  deleteMetric() {
    let serviceCall;
    
    switch (this.title) {
      case 'Presión Arterial':
        serviceCall = this.metricsService.deleteBloodPressureData(this.data.id);
        break;
      case 'Frecuencia Cardiaca':
        serviceCall = this.metricsService.deleteHeartRateData(this.data.id);
        break;
      case 'Frecuencia Respiratoria':
        serviceCall = this.metricsService.deleteRespiratoryRateData(this.data.id);
        break;
      case 'Glucosa en la Sangre':
        serviceCall = this.metricsService.deleteBloodGlucoseData(this.data.id);
        break;
      case 'Oxigeno en la sangre':
        serviceCall = this.metricsService.deleteBloodOxygenData(this.data.id);
        break;
      default:
        this.toastService.presentToast('Tipo de métrica no reconocido', 'danger');
        return;
    }
    
    serviceCall.subscribe(
      () => {
        this.toastService.presentToast('Registro eliminado correctamente', 'success');
        this.dismiss(true);
      },
      (error) => {
        console.error('Error al eliminar registro:', error);
        this.toastService.presentToast('Error al eliminar el registro', 'danger');
      }
    );
  }
}