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
import { IonicModule, NavController } from '@ionic/angular';
import {
  Beneficiary,
  Vaccine,
} from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { InputComponent } from 'src/app/shared/components/input/input.component';

@Component({
  selector: 'app-vacinations-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputComponent,
    CustomButtonComponent,
    IonicModule
  ],
  templateUrl: './vacinations-form.component.html',
  styleUrls: ['./vacinations-form.component.scss'],
})
export class VacinationsFormComponent implements OnInit {
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
      vaccinations: this.fb.array([]),
    });

    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
      this.initializeForm();
    });
  }

  initializeForm() {
    if (!this.activeBeneficiary) return;

    if (this.activeBeneficiary.health_data?.medical_info?.vaccines?.length) {
      this.form.setControl(
        'vaccinations',
        this.fb.array(
          this.activeBeneficiary.health_data?.medical_info.vaccines.map((v) =>
            this.fb.group({
              id: v.id,
              id_paciente: this.activeBeneficiary?.id,
              vacuna: [v.vacuna, Validators.required],
            })
          )
        )
      );
    } else {
      // Si no tiene datos, inicializamos un array vacío
      this.form.setControl('vaccinations', this.fb.array([]));
    }
  }

  ngOnInit() {}

  isFormValid(): boolean {
    return this.vaccinations.length > 0 && this.vaccinations.valid;
  }

  get vaccinations(): FormArray {
    return this.form.get('vaccinations') as FormArray;
  }

  getVaccinationFormGroup(index: number): FormGroup {
    return this.vaccinations.at(index) as FormGroup;
  }

  newVaccination(): FormGroup {
    return this.fb.group({
      id_paciente: this.activeBeneficiary?.id,
      vacuna: ['', [Validators.required]],
    });
  }

  addVaccination() {
    this.vaccinations.push(this.newVaccination());
    this.form.updateValueAndValidity();
  }

  removeVaccination(index: number) {
    this.vaccinations.removeAt(index);
    this.form.updateValueAndValidity();
  }

  getFormControl(formGroup: FormGroup, fieldName: string): FormControl {
    return formGroup.get(fieldName) as FormControl;
  }

  async submitForm() {
    if (this.form.valid && this.activeBeneficiary) {
      const payload = {
        id_paciente: this.activeBeneficiary.id,
        vacunas: this.vaccinations.value.map((v: any) => ({
          vacuna: v.vacuna,
        }))
      };

      console.log('Enviando vacunas:', payload);
      
      this.healthDataService.syncVaccines(payload).subscribe(
        async (response) => {
          console.log('Respuesta vacunas:', response);
          
          if (response.data?.maintained) {
            const updatedVaccines: Vaccine[] = response.data.maintained;
  
            if (!this.activeBeneficiary?.id) {
              return;
            }
  
            // Crear una copia profunda del objeto para evitar mutaciones no deseadas
            const updatedActiveBeneficiary: Beneficiary = {
              ...this.activeBeneficiary,
              health_data: {
                ...this.activeBeneficiary.health_data,
                medical_info: {
                  ...this.activeBeneficiary.health_data.medical_info,
                  vaccines: updatedVaccines
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
          }
          
          await this.toastService.presentToast(
            'Vacunas guardadas correctamente',
            'success'
          );
          this.navCtrl.navigateRoot('/beneficiary/home/vacinations');
        },
        async (error) => {
          console.error('Error al guardar vacunas:', error);
          await this.toastService.presentToast(
            'Error al guardar las vacunas',
            'danger'
          );
        }
      );
    }
  }
}