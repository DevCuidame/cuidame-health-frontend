import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
// import { MetricsService } from 'src/app/services/Metrics/metrics.service';

@Component({
  selector: 'update-app-metric-form',
  templateUrl: './update-metric-form.component.html',
  styleUrls: ['./update-metric-form.component.scss'],
})
export class UpdateMetricFormComponent implements OnInit {
  // @Input() title: string;
  @Input() data: any;
  // metricForm: FormGroup;
  // selectedDate: string;
  // selectedTime: string;

  // public patient_id: number;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    // private metricsService: MetricsService,
    // public toastMessage: ToastMessage,
    // private storageService: StorageService
  ) {
    // this.patient_id = Number(this.storageService.getPatientId());
  }

  ngOnInit() {

    // Convertir la fecha recibida a UTC si está disponible, o usar la fecha actual
    const initialDateTime = this.data?.date
      ? new Date(this.data.date + 'Z')
      : new Date();
    // 'Z' asegura que se interprete como UTC

    // Convertir la fecha y la hora a UTC para el formulario
    // this.selectedDate = initialDateTime.toISOString().split('T')[0];
    // this.selectedTime = initialDateTime.toISOString().split('T')[1].slice(0, 5); // Hora en formato HH:MM

    // Inicializa el formulario
    // this.metricForm = this.fb.group({
    //   patient_id: [this.patient_id],
    //   systolic: [this.data?.systolic || ''],
    //   diastolic: [this.data?.diastolic || ''],
    //   rate: [this.data?.rate || ''],
    //   date: [this.selectedDate, [Validators.required, this.dateValidator]],
    //   time: [this.selectedTime, [Validators.required, this.timeValidator]],
    // });

    // Aplicar validadores dinámicos en función de la métrica
    // if (this.title === 'Presión Arterial') {
    //   this.metricForm.get('systolic').setValidators(Validators.required);
    //   this.metricForm.get('diastolic').setValidators(Validators.required);
    // } else {
    //   this.metricForm.get('rate').setValidators(Validators.required);
    // }

    // this.metricForm.updateValueAndValidity();
  }

  // Validador personalizado para la fecha (YYYY-MM-DD)
  dateValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!control.value || !datePattern.test(control.value)) {
      return { invalidDate: true };
    }
    return null;
  }

  // Validador personalizado para la hora (HH:MM)
  timeValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!control.value || !timePattern.test(control.value)) {
      return { invalidTime: true };
    }
    return null;
  }

  // updateSystolic(event: any) {
  //   this.metricForm.controls['systolic'].setValue(event.detail.value);
  // }

  // updateDiastolic(event: any) {
  //   this.metricForm.controls['diastolic'].setValue(event.detail.value);
  // }

  // updateRate(event: any) {
  //   this.metricForm.controls['rate'].setValue(event.detail.value);
  // }

  // Actualiza la fecha seleccionada (convertida a UTC)
  // updateSelectedDate(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   this.selectedDate = input.value;
  //   this.metricForm.get('date').setValue(this.selectedDate);
  // }

  // Actualiza la hora seleccionada (convertida a UTC)
  // updateSelectedTime(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   this.selectedTime = input.value;
  //   this.metricForm.get('time').setValue(this.selectedTime);
  // }

  // Método de submit ajustado para enviar los datos correctamente formateados
  onSubmit() {
    // if (this.metricForm.valid) {
    //   const metricData = this.metricForm.value;
    //   // Crear una fecha en UTC para que no cambie la hora por la zona horaria local
    //   const dateTime = new Date(`${metricData.date}T${metricData.time}:00Z`); // 'Z' fuerza a UTC

    //   const dataToSubmit = {
    //     ...metricData,
    //     date: dateTime.toISOString(),
    //   };
 

    //   // Lógica de actualización según el tipo de métrica
    //   if (this.title === 'Presión Arterial') {
    //     this.metricsService
    //       .updateBloodPressureData(dataToSubmit, this.data.id)
    //       .subscribe(() => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Frecuencia Cardiaca') {
    //     this.metricsService
    //       .updateHeartRateData(dataToSubmit, this.data.id)
    //       .subscribe(() => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Frecuencia Respiratoria') {
    //     this.metricsService
    //       .updateRespiratoryRateData(dataToSubmit, this.data.id)
    //       .subscribe(() => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Glucosa en la Sangre') {
    //     this.metricsService
    //       .updateBloodGlucoseData(dataToSubmit, this.data.id)
    //       .subscribe(() => {
    //         this.dismiss(true);
    //       });
    //   } else if (this.title === 'Oxigeno en la sangre') {
    //     this.metricsService
    //       .updateBloodOxygenData(dataToSubmit, this.data.id)
    //       .subscribe(() => {
    //         this.dismiss(true);
    //       });
    //   }
    // } else {
    //   this.toastMessage.presentToast("Revisa el formulario");
    // }
  }

   // Método para eliminar métricas por ID
  //  onDelete() {
  //   if (this.title === 'Presión Arterial') {
  //     this.metricsService.deleteBloodPressureData(this.data.id).subscribe(() => {
  //       this.dismiss(true); // Cierra el modal y recarga
  //     });
  //   } else if (this.title === 'Frecuencia Cardiaca') {
  //     this.metricsService.deleteHeartRateData(this.data.id).subscribe(() => {
  //       this.dismiss(true);
  //     });
  //   } else if (this.title === 'Frecuencia Respiratoria') {
  //     this.metricsService.deleteRespiratoryRateData(this.data.id).subscribe(() => {
  //       this.dismiss(true);
  //     });
  //   } else if (this.title === 'Glucosa en la Sangre') {
  //     this.metricsService.deleteBloodGlucoseData(this.data.id).subscribe(() => {
  //       this.dismiss(true);
  //     });
  //   } else if (this.title === 'Oxigeno en la sangre') {
  //     this.metricsService.deleteBloodOxygenData(this.data.id).subscribe(() => {
  //       this.dismiss(true);
  //     });
  //   }
  // }


  // Cierra el modal
  dismiss(reload: boolean = false) {
    this.modalController.dismiss({ reload });
  }
}
