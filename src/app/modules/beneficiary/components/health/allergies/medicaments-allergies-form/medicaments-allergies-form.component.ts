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
  selector: 'app-medicaments-allergies-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputComponent,
    CustomButtonComponent,
  ],
  templateUrl: './medicaments-allergies-form.component.html',
  styleUrls: ['./medicaments-allergies-form.component.scss'],
})
export class MedicamentsAllergiesFormComponent implements OnInit {
  public activeBeneficiary: Beneficiary | null = null;
  public buttonBackground: string = 'assets/background/secondary_button_bg.svg';

  form: FormGroup;

  severityOptions = [
    { value: 'MILD', label: 'Leve' },
    { value: 'MODERATE', label: 'Moderada' },
    { value: 'SEVERE', label: 'Grave' },
  ];

  constructor(
    private fb: FormBuilder,
    private beneficiaryService: BeneficiaryService,
    private healthDataService: HealthDataService,
    private navCtrL: NavController,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      medications: this.fb.array([]),
      allergies: this.fb.array([]),
    });

    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
      this.initializeForm();
    });
    
    // Se eliminaron las llamadas automáticas a addMedication() y addAllergy()
  }

  ngOnInit() {}

  initializeForm() {
    if (!this.activeBeneficiary) return;

    if (this.activeBeneficiary.health_data?.medical_info?.allergies?.length) {
      this.form.setControl(
        'allergies',
        this.fb.array(
          this.activeBeneficiary.health_data?.medical_info?.allergies?.map((a) =>
            this.fb.group({
              id: a.id,
              paciente_id: this.activeBeneficiary?.id,
              tipo_alergia: [a.tipo_alergia, [Validators.required]],
              descripcion: [a.descripcion, [Validators.required]],
            })
          )
        )
      );
    } else {
      // Si no tiene datos, inicializamos un array vacío
      this.form.setControl('allergies', this.fb.array([]));
    }
  }

  isFormValid(): boolean {
    // Solo validamos si hay elementos en los arrays
    if (this.allergies.length === 0) {
      return false;
    }
    
    return (
      (this.allergies.length > 0 && this.allergies.valid)
    );
  }

  get allergies(): FormArray {
    return this.form.get('allergies') as FormArray;
  }

  getAllergyFormGroup(index: number): FormGroup {
    return this.allergies.at(index) as FormGroup;
  }

  getFormControl(formGroup: FormGroup, fieldName: string): FormControl {
    return formGroup.get(fieldName) as FormControl;
  }


  newAllergy(): FormGroup {
    return this.fb.group({
      paciente_id: this.activeBeneficiary?.id,
      tipo_alergia: ['', [Validators.required]],
      descripcion: ['', [Validators.required]]
    });
  }


  addAllergy() {
    this.allergies.push(this.newAllergy());
    this.form.updateValueAndValidity();
  }

  removeAllergy(index: number) {
    this.allergies.removeAt(index);
    this.form.updateValueAndValidity();
  }

  async submitForm() {
    if (this.form.valid && this.activeBeneficiary) {
      const payload = {
        allergies: this.form.value.allergies
      };

      this.healthDataService.saveAllergiesAndMedications(payload).subscribe(
        async (response) => {
          if (
            response.data?.allergies?.length
          ) {
            const updatedAllergies = response.data.allergies || [];

            if (!this.activeBeneficiary?.id) {
              return;
            }

            const updatedActiveBeneficiary = {
              ...this.activeBeneficiary,
              allergies: updatedAllergies,
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
            this.beneficiaryService.setBeneficiaries(updatedBeneficiaries);
          }
          await this.toastService.presentToast(
            response.data.message,
            'success'
          );
          this.navCtrL.navigateRoot('/beneficiary/home/medicaments-allergies');
        },
        async (error) => {
          await this.toastService.presentToast(error.data.message, 'danger');
        }
      );
    }
  }
}