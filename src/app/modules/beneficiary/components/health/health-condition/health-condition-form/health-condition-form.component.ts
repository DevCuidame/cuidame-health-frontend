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
    private navCtrL: NavController,
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

    // Inicializar el formArray de enfermedades (alergias)
    this.form.setControl(
      'diseases',
      this.fb.array(
        this.activeBeneficiary.health_data?.medical_info?.diseases?.map((disease) =>
          this.fb.group({
            id: disease.id,
            paciente_id: this.activeBeneficiary?.id,
            disease: [disease.enfermedad, [Validators.required]]
          })
        ) || []
      )
    );

    // Inicializar el formArray de discapacidades
    // Considerando que la condición es un objeto único, no un array
    const condition = this.activeBeneficiary.health_data?.medical_info?.condition;
    this.form.setControl(
      'disabilities',
      this.fb.array(
        condition ? [
          this.fb.group({
            id: condition.id,
            paciente_id: this.activeBeneficiary?.id,
            name: [condition.discapacidad, [Validators.required]],
          })
        ] : []
      )
    );

    // Inicializar el formArray de rasgos distintivos
    // Usamos cicatrices y tatuajes como rasgos distintivos
    const distinctives = [];
    const condition2 = this.activeBeneficiary.health_data?.medical_info?.condition;
    
    if (condition2?.cicatrices_descripcion) {
      distinctives.push(
        this.fb.group({
          id: condition2.id,
          paciente_id: this.activeBeneficiary?.id,
          description: [condition2.cicatrices_descripcion, [Validators.required]],
          type: ['cicatrices']
        })
      );
    }
    
    if (condition2?.tatuajes_descripcion) {
      distinctives.push(
        this.fb.group({
          id: condition2.id,
          paciente_id: this.activeBeneficiary?.id,
          description: [condition2.tatuajes_descripcion, [Validators.required]],
          type: ['tatuajes']
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
      paciente_id: this.activeBeneficiary?.id,
      disease: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
    });
  }

  newDisability(): FormGroup {
    return this.fb.group({
      paciente_id: this.activeBeneficiary?.id,
      name: ['', [Validators.required]],
    });
  }

  newDistinctive(): FormGroup {
    return this.fb.group({
      paciente_id: this.activeBeneficiary?.id,
      description: ['', [Validators.required]],
      type: ['cicatrices'], // Por defecto cicatrices, esto se podría hacer seleccionable
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
    this.distinctives.push(this.newDistinctive());
    this.form.updateValueAndValidity();
  }

  removeDistinctive(index: number) {
    this.distinctives.removeAt(index);
    this.form.updateValueAndValidity();
  }

  async submitForm() {
    if (this.form.valid && this.activeBeneficiary) {
      // Preparamos un payload adaptado a lo que espera el backend
      const payload = {
        id_paciente: this.activeBeneficiary.id,
        allergies: this.form.value.diseases.map((d: any) => ({
          tipo_alergia: d.disease,
          descripcion: d.descripcion
        })),
        condition: {
          discapacidad: this.form.value.disabilities.length > 0 
            ? this.form.value.disabilities[0].name 
            : null,
          cicatrices_descripcion: this.form.value.distinctives.find((d: any) => d.type === 'cicatrices')?.description || null,
          tatuajes_descripcion: this.form.value.distinctives.find((d: any) => d.type === 'tatuajes')?.description || null
        }
      };

      this.healthDataService.saveHealthCondition(payload).subscribe(
        async (response) => {
          if (response.success) {
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
                  allergies: response.data.allergies || this.activeBeneficiary.health_data.medical_info.allergies,
                  condition: response.data.condition || this.activeBeneficiary.health_data.medical_info.condition
                }
              }
            };

            this.beneficiaryService.setActiveBeneficiary(updatedActiveBeneficiary);

            const updatedBeneficiaries = this.beneficiaryService
              .getBeneficiaries()
              .map((b) =>
                b.id === updatedActiveBeneficiary.id
                  ? updatedActiveBeneficiary
                  : b
              );

            this.beneficiaryService.setBeneficiaries(updatedBeneficiaries);
          }

          await this.toastService.presentToast(
            response.message || 'Datos guardados correctamente',
            'success'
          );
          this.navCtrL.navigateRoot('/beneficiary/home/conditions');
        },
        async (error) => {
          await this.toastService.presentToast(
            error.message || 'Error al guardar los datos',
            'danger'
          );
        }
      );
    }
  }
}