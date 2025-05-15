import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NavController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { InputComponent } from 'src/app/shared/components/input/input.component';

@Component({
  selector: 'app-medicaments-allergies-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputComponent,
    CustomButtonComponent,
  ],
  templateUrl: './medicaments-allergies-form.component.html',
  styleUrls: ['./medicaments-allergies-form.component.scss'],
})
export class MedicamentsAllergiesFormComponent implements OnInit, OnDestroy {
  public activeBeneficiary: Beneficiary | null = null;
  public buttonBackground: string = 'assets/background/button_secondary_bg.png';
  public isLoading: boolean = false;

  // Para limpiar suscripciones
  private destroy$ = new Subject<void>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private beneficiaryService: BeneficiaryService,
    private healthDataService: HealthDataService,
    private navCtrl: NavController,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      allergies: this.fb.array([]),
    });

    // Mejorar la suscripción con limpieza adecuada
    this.beneficiaryService.activeBeneficiary$
      .pipe(takeUntil(this.destroy$))
      .subscribe((beneficiary) => {
        if (!beneficiary) return;
        
        this.activeBeneficiary = beneficiary;
        
        // Verificar si necesita cargar datos de salud
        if (!beneficiary.health_data || !beneficiary.health_data.medical_info) {
          
          // Si es necesario, cargar datos de salud primero
          if (beneficiary.id) {
            this.loadHealthData(beneficiary.id);
          }
        } else {
          // Si ya tiene datos, inicializar el formulario directamente
          this.initializeForm();
        }
      });
  }

  ngOnInit() {}

  ngOnDestroy() {
    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos de salud del beneficiario si son necesarios
   */
  loadHealthData(beneficiaryId: number) {
    this.isLoading = true;
    
    this.healthDataService.getHealthData(beneficiaryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (healthData: any) => {
          
          if (this.activeBeneficiary) {
            // Actualizar solo localmente para evitar ciclos
            this.activeBeneficiary = {
              ...this.activeBeneficiary,
              health_data: healthData
            };
            
            // Una vez cargados los datos, inicializar el formulario
            this.initializeForm();
          }
          
          this.isLoading = false;
        },
        (error) => {
          console.error("Error al cargar datos de salud:", error);
          this.toastService.presentToast('Error al cargar datos de salud', 'danger');
          this.isLoading = false;
          
          // Intentar inicializar el formulario de todos modos
          this.initializeForm();
        }
      );
  }

  initializeForm() {
    if (!this.activeBeneficiary) return;
    if (this.activeBeneficiary.health_data?.medical_info?.allergies?.length) {
      this.form.setControl(
        'allergies',
        this.fb.array(
          this.activeBeneficiary.health_data?.medical_info?.allergies?.map((a) =>
            this.fb.group({
              id: a.id,
              id_paciente: this.activeBeneficiary?.id,
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
    return this.allergies.length > 0 && this.allergies.valid;
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
      id_paciente: this.activeBeneficiary?.id,
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
    if (!this.form.valid || !this.activeBeneficiary) {
      this.toastService.presentToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }
    
    this.isLoading = true;

    const payload = {
      id_paciente: this.activeBeneficiary.id,
      alergias: this.allergies.value.map((a: any) => ({
        tipo_alergia: a.tipo_alergia,
        descripcion: a.descripcion
      }))
    };


    try {
      this.healthDataService.syncAllergies(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          async (response) => {
            
            if (response.data?.maintained) {
              const updatedAllergies = response.data.maintained || [];

              if (this.activeBeneficiary?.id) {
                // Primero actualizar localmente
                const updatedHealthData = {
                  ...(this.activeBeneficiary.health_data || {}),
                  medical_info: {
                    ...(this.activeBeneficiary.health_data?.medical_info || {}),
                    allergies: updatedAllergies
                  }
                };
                
                // Crear una nueva referencia del beneficiario
                const updatedBeneficiary = {
                  ...this.activeBeneficiary,
                  health_data: updatedHealthData
                };

                // Actualizar el beneficiario activo en el servicio
                this.beneficiaryService.setActiveBeneficiary(updatedBeneficiary);
              }
            }
            
            this.isLoading = false;
            await this.toastService.presentToast(
              'Alergias guardadas correctamente',
              'success'
            );
            this.navCtrl.navigateRoot('/beneficiary/home/medicaments-allergies');
          },
          async (error) => {
            console.error('Error al guardar alergias:', error);
            this.isLoading = false;
            await this.toastService.presentToast(
              'Error al guardar las alergias',
              'danger'
            );
          }
        );
    } catch (error) {
      console.error('Error al procesar el formulario:', error);
      this.isLoading = false;
      await this.toastService.presentToast(
        'Error al guardar las alergias',
        'danger'
      );
    }
  }
}