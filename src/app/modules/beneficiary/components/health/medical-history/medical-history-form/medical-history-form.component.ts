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
import { historyTypeOptions, relativeOptions } from 'src/app/core/constants/options';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { InputComponent } from 'src/app/shared/components/input/input.component';

@Component({
  selector: 'app-medical-history-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputComponent,
    CustomButtonComponent,
  ],
  templateUrl: './medical-history-form.component.html',
  styleUrls: ['./medical-history-form.component.scss'],
})
export class MedicalHistoryFormComponent implements OnInit {
  public activeBeneficiary: Beneficiary | null = null;
  public buttonBackground: string = 'assets/background/secondary_button_bg.svg';


  public relativeOptions = relativeOptions
  public historyTypeOptions = historyTypeOptions
  

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private beneficiaryService: BeneficiaryService,
    private healthDataService: HealthDataService,
    private navCtrL: NavController,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      medicalHistory: this.fb.array([]),
      familyHistory: this.fb.array([]),
    });

    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
      this.initializeForm();
    });

  }

  ngOnInit() {}

  initializeForm() {
    if (!this.activeBeneficiary) return;

    this.form.setControl(
      'medicalHistory',
      this.fb.array(
        this.activeBeneficiary.health_data.medical_info.backgrounds?.map((m) =>
          this.fb.group({
            id: m.id,
            paciente_id: this.activeBeneficiary?.id,
            tipo_antecedente: [m.tipo_antecedente, [Validators.required]],
            descripcion_antecedente: [m.descripcion_antecedente, [Validators.required]],
            fecha_antecedente: [m.fecha_antecedente, [Validators.required]],
          })
        ) || []
      )
    );

    this.form.setControl(
      'familyHistory',
      this.fb.array(
        this.activeBeneficiary.health_data.medical_info.familyBackgrounds?.map((f) =>
          this.fb.group({
            id: f.id,
            paciente_id: this.activeBeneficiary?.id,
            tipo_antecedente: [f.tipo_antecedente, [Validators.required]],
            parentesco: [f.parentesco, [Validators.required]],
            descripcion_antecedente: [f.descripcion_antecedente, [Validators.required]],
          })
        ) || []
      )
    );
  }

  isFormValid(): boolean {
    return (
      (this.familyHistory.length > 0 && this.familyHistory.valid) ||
      (this.medicalHistory.length > 0 && this.medicalHistory.valid)
    );
  }
  
  get medicalHistory(): FormArray {
    return this.form.get('medicalHistory') as FormArray;
  }

  get familyHistory(): FormArray {
    return this.form.get('familyHistory') as FormArray;
  }

  getMedicalHistoryFormGroup(index: number): FormGroup {
    return this.medicalHistory.at(index) as FormGroup;
  }

  getFamilyHistoryFormGroup(index: number): FormGroup {
    return this.familyHistory.at(index) as FormGroup;
  }

  getFormControl(formGroup: FormGroup, fieldName: string): FormControl {
    return formGroup.get(fieldName) as FormControl;
  }

  newMedicalHistory(): FormGroup {
    return this.fb.group({
      paciente_id: this.activeBeneficiary?.id,
      history_type: ['', [Validators.required]],
      description: ['', [Validators.required]],
      history_date: ['', [Validators.required]],
    });
  }

  newFamilyHistory(): FormGroup {
    return this.fb.group({
      paciente_id: this.activeBeneficiary?.id,
      history_type: ['', [Validators.required]],
      relationship: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  addMedicalHistory() {
    this.medicalHistory.push(this.newMedicalHistory());
    this.form.updateValueAndValidity();
  }

  removeMedicalHistory(index: number) {
      this.medicalHistory.removeAt(index);
      this.form.updateValueAndValidity();
  }

  addFamilyHistory() {
    this.familyHistory.push(this.newFamilyHistory());
    this.form.updateValueAndValidity();
  }

  removeFamilyHistory(index: number) {
      this.familyHistory.removeAt(index);
      this.form.updateValueAndValidity();
  }

  async submitForm() {
    if (this.form.valid && this.activeBeneficiary) {
      const payload = {
        medicalHistory: this.form.value.medicalHistory,
        familyHistory: this.form.value.familyHistory,
      };

      this.healthDataService.saveMedicalAndFamilyHistory(payload).subscribe(
        async (response) => {
          if (
            response.data?.medicalHistory?.length ||
            response.data?.familyHistory?.length
          ) {
            const updatedMedicalHistory = response.data.medicalHistory || [];
            const updatedFamilyHistory = response.data.familyHistory || [];

            if (!this.activeBeneficiary?.id) {
              return;
            }

            const updatedActiveBeneficiary = {
              ...this.activeBeneficiary,
              medical_history: updatedMedicalHistory,
              family_history: updatedFamilyHistory,
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
          await this.toastService.presentToast(response.data.message, 'success');
          this.navCtrL.navigateRoot('/beneficiary/home/medical-history');
        },

        async (error) => {
          await this.toastService.presentToast(error.data.message, 'danger');
        }
      );
    }
  }
}
