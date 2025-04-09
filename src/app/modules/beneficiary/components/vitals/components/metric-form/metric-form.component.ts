import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MetricsService } from 'src/app/core/services/Metrics/metrics.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-form',
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './metric-form.component.html',
  styleUrls: ['./metric-form.component.scss'],
})
export class MetricFormComponent implements OnInit {
  @Input() title: string = '';
  // metricForm: FormGroup;
  showDateTimePicker = false;
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedTime: string = new Date().toTimeString().split(' ')[0].slice(0, 5);

  // public patient_id: number;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private metricsService: MetricsService,
  ) {
    // this.patient_id = Number(this.storageService.getPatientId());
  }

  updateSystolic(event: any) {
    // this.metricForm.controls['systolic'].setValue(event.detail.value);
  }

  updateDiastolic(event: any) {
    // this.metricForm.controls['diastolic'].setValue(event.detail.value);
  }

  updateRate(event: any) {
    // this.metricForm.controls['rate'].setValue(event.detail.value);
  }

  ngOnInit() {
    // this.metricForm = this.fb.group({
    //   patient_id: this.patient_id,
    //   systolic: [''],
    //   diastolic: [''],
    //   rate: [''],
    //   date: [this.selectedDate, Validators.required],
    //   time: [this.selectedTime, Validators.required],
    // });

    // Configurar validadores basados en el tipo de métrica
    if (this.title === 'Presión Arterial') {
      // this.metricForm.get('systolic').setValidators(Validators.required);
      // this.metricForm.get('diastolic').setValidators(Validators.required);
    } else {
      // this.metricForm.get('rate').setValidators(Validators.required);
    }

    // Reactiva los cambios en los controles del formulario
    // this.metricForm.updateValueAndValidity();
  }

  dismiss(reload: boolean = false) {
    this.modalController.dismiss({ reload });
  }

  onSubmit() {
    // if (this.metricForm.valid) {
    //   const metricData = this.metricForm.value;
    //   const dateTime = new Date(`${metricData.date}T${metricData.time}:00Z`); // 'Z' fuerza a UTC
    //   // const dateTime = new Date(`${metricData.date}T${metricData.time}`);

    //   const dataToSubmit = {
    //     ...metricData,
    //     date: dateTime.toISOString(),
    //   };

    //   if (this.title === 'Presión Arterial') {
    //     this.metricsService
    //       .addBloodPressureData(dataToSubmit)
    //       .subscribe((response) => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Frecuencia Cardiaca') {
    //     this.metricsService
    //       .addHeartRateData(dataToSubmit)
    //       .subscribe((response) => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Frecuencia Respiratoria') {
    //     this.metricsService
    //       .addRespiratoryRateData(dataToSubmit)
    //       .subscribe((response) => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Glucosa en la Sangre') {
    //     this.metricsService
    //       .addBloodGlucoseData(dataToSubmit)
    //       .subscribe((response) => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Oxigeno en la sangre') {
    //     this.metricsService
    //       .addBloodOxygenData(dataToSubmit)
    //       .subscribe((response) => {
    //         this.dismiss(true);
    //       });
    //   }
    // } else {
    //   console.log('Form is invalid');
    // }
  }

  toggleDateTimePicker() {
    this.showDateTimePicker = !this.showDateTimePicker;
  }

  // Actualiza la fecha seleccionada (convertida a UTC)
  updateSelectedDate(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;
    // this.metricForm.get('date').setValue(this.selectedDate);
  }

  // Actualiza la hora seleccionada (convertida a UTC)
  updateSelectedTime(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedTime = input.value;
    // this.metricForm.get('time').setValue(this.selectedTime);
  }

  range(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
