import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NavController } from '@ionic/angular';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { InputComponent } from 'src/app/shared/components/input/input.component';

@Component({
  selector: 'app-health-condition-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputComponent,
    CustomButtonComponent,
  ],
  templateUrl: './health-condition-form.component.html',
  styleUrls: ['./health-condition-form.component.scss'],
})
export class HealthConditionFormComponent implements OnInit {
  public activeBeneficiary: Beneficiary | null = null;
  public buttonBackground: string = 'assets/background/secondary_button_bg.svg';

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private beneficiaryService: BeneficiaryService,
    private healthDataService: HealthDataService,
    private navCtrl: NavController,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      diseases: this.fb.array([]),
      disabilities: this.fb.array([]),
      distinctives: this.fb.array([]),
    });

    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
      this.initializeForm();
    });
  }

  ngOnInit() {}

  initializeForm() {
    if (!this.activeBeneficiary) return;

    // Inicializar el formArray de enfermedades
    if (this.activeBeneficiary.health_data?.medical_info?.diseases) {
      this.form.setControl(
        'diseases',
        this.fb.array(
          this.activeBeneficiary.health_data.medical_info.diseases.map(
            (disease) =>
              this.fb.group({
                id: disease.id,
                id_paciente: this.activeBeneficiary?.id,
                enfermedad: [disease.enfermedad, [Validators.required]],
              })
          ) || []
        )
      );
    }

    // Inicializar el formArray de discapacidades
    const condition =
      this.activeBeneficiary.health_data?.medical_info?.condition;
    if (condition?.discapacidad) {
      this.form.setControl(
        'disabilities',
        this.fb.array([
          this.fb.group({
            id: condition.id,
            id_paciente: this.activeBeneficiary?.id,
            name: [condition.discapacidad, [Validators.required]],
          }),
        ])
      );
    }

    // Inicializar el formArray de rasgos distintivos
    const distinctives = [];

    if (condition?.cicatrices_descripcion) {
      distinctives.push(
        this.fb.group({
          id: condition.id,
          id_paciente: this.activeBeneficiary?.id,
          description: [
            condition.cicatrices_descripcion,
            [Validators.required],
          ],
          type: ['cicatrices'],
        })
      );
    }

    if (condition?.tatuajes_descripcion) {
      distinctives.push(
        this.fb.group({
          id: condition.id,
          id_paciente: this.activeBeneficiary?.id,
          description: [condition.tatuajes_descripcion, [Validators.required]],
          type: ['tatuajes'],
        })
      );
    }

    this.form.setControl('distinctives', this.fb.array(distinctives));
  }

  isFormValid(): boolean {
    return (
      (this.diseases.length > 0 && this.diseases.valid) ||
      (this.disabilities.length > 0 && this.disabilities.valid) ||
      (this.distinctives.length > 0 && this.distinctives.valid)
    );
  }

  get diseases(): FormArray {
    return this.form.get('diseases') as FormArray;
  }

  get disabilities(): FormArray {
    return this.form.get('disabilities') as FormArray;
  }

  get distinctives(): FormArray {
    return this.form.get('distinctives') as FormArray;
  }

  getDiseaseFormGroup(index: number): FormGroup {
    return this.diseases.at(index) as FormGroup;
  }

  getDisabilityFormGroup(index: number): FormGroup {
    return this.disabilities.at(index) as FormGroup;
  }

  getDistinctiveFormGroup(index: number): FormGroup {
    return this.distinctives.at(index) as FormGroup;
  }

  getFormControl(formGroup: FormGroup, fieldName: string): FormControl {
    return formGroup.get(fieldName) as FormControl;
  }

  newDisease(): FormGroup {
    return this.fb.group({
      id_paciente: this.activeBeneficiary?.id,
      enfermedad: ['', [Validators.required]],
    });
  }

  newDisability(): FormGroup {
    return this.fb.group({
      id_paciente: this.activeBeneficiary?.id,
      name: ['', [Validators.required]],
    });
  }

  newDistinctive(): FormGroup {
    return this.fb.group({
      id_paciente: this.activeBeneficiary?.id,
      description: ['', [Validators.required]],
      type: ['cicatrices'],
    });
  }

  addDisease() {
    this.diseases.push(this.newDisease());
    this.form.updateValueAndValidity();
  }

  removeDisease(index: number) {
    this.diseases.removeAt(index);
    this.form.updateValueAndValidity();
  }

  addDisability() {
    this.disabilities.push(this.newDisability());
    this.form.updateValueAndValidity();
  }

  removeDisability(index: number) {
    this.disabilities.removeAt(index);
    this.form.updateValueAndValidity();
  }

  addDistinctive() {
    if (this.distinctives.length < 2) {
      this.distinctives.push(this.newDistinctive());
      this.form.updateValueAndValidity();
    }
  }

  removeDistinctive(index: number) {
    this.distinctives.removeAt(index);
    this.form.updateValueAndValidity();
  }

  async submitForm() {
    if (this.form.valid && this.activeBeneficiary) {
      // Preparar los datos de enfermedades para enviar al endpoint
      const diseasesPayload = {
        id_paciente: this.activeBeneficiary.id,
        enfermedades: this.diseases.value.map((d: any) => ({
          enfermedad: d.enfermedad,
        })),
      };

      // Preparar la información de condición médica
      // Este es un objeto único, no un array
      const conditionPayload = {
        id_paciente: this.activeBeneficiary.id,
        discapacidad:
          this.disabilities.length > 0
            ? this.disabilities.at(0).get('name')?.value
            : null,
        cicatrices_descripcion:
          this.distinctives.value.find((d: any) => d.type === 'cicatrices')
            ?.description || null,
        tatuajes_descripcion:
          this.distinctives.value.find((d: any) => d.type === 'tatuajes')
            ?.description || null,
      };

      console.log('Enviando condition:', conditionPayload);

      // Primero, enviar las enfermedades
      this.healthDataService.syncDiseases(diseasesPayload).subscribe(
        async (diseasesResponse) => {
          console.log('Respuesta diseases:', diseasesResponse);

          // Después, enviar la condición médica
          this.healthDataService
            .saveHealthCondition(conditionPayload)
            .subscribe(
              async (conditionResponse) => {
                console.log('Respuesta condition:', conditionResponse);

                // Actualizar el beneficiario con los datos actualizados
                if (!this.activeBeneficiary?.id) {
                  return;
                }

                // Crear una estructura actualizada que coincida con la estructura esperada
                const updatedActiveBeneficiary = {
                  ...this.activeBeneficiary,
                  health_data: {
                    ...this.activeBeneficiary.health_data,
                    medical_info: {
                      ...this.activeBeneficiary.health_data.medical_info,
                      diseases:
                        diseasesResponse.data?.maintained ||
                        this.activeBeneficiary.health_data.medical_info
                          .diseases,
                      condition:
                        conditionResponse.data?.maintained ||
                        this.activeBeneficiary.health_data.medical_info
                          .condition,
                    },
                  },
                };

                this.beneficiaryService.setActiveBeneficiary(
                  updatedActiveBeneficiary
                );

                const updatedBeneficiaries = this.beneficiaryService
                  .getBeneficiaries()
                  .map((b) =>
                    b.id === updatedActiveBeneficiary.id
                      ? updatedActiveBeneficiary
                      : b
                  );


                await this.toastService.presentToast(
                  'Datos guardados correctamente',
                  'success'
                );
                this.navCtrl.navigateRoot('/beneficiary/home/conditions');
              },
              async (error) => {
                console.error('Error al guardar la condición:', error);
                await this.toastService.presentToast(
                  'Error al guardar la condición médica',
                  'danger'
                );
              }
            );
        },
        async (error: any) => {
          console.error('Error al guardar las enfermedades:', error);
          await this.toastService.presentToast(
            'Error al guardar las enfermedades',
            'danger'
          );
        }
      );
    }
  }
}
