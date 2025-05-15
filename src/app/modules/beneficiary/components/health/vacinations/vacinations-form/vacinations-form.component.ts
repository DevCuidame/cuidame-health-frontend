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
import { IonicModule, NavController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  standalone: true,
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
export class VacinationsFormComponent implements OnInit, OnDestroy {
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
      vaccinations: this.fb.array([]),
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
    if (!this.form.valid || !this.activeBeneficiary) {
      this.toastService.presentToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }
    
    this.isLoading = true;

    const payload = {
      id_paciente: this.activeBeneficiary.id,
      vacunas: this.vaccinations.value.map((v: any) => ({
        vacuna: v.vacuna,
      }))
    };

    
    try {
      this.healthDataService.syncVaccines(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          async (response) => {
            
            if (response.data?.maintained) {
              const updatedVaccines: Vaccine[] = response.data.maintained;
      
              if (this.activeBeneficiary?.id) {
                // Primero actualizar localmente
                const updatedHealthData = {
                  ...(this.activeBeneficiary.health_data || {}),
                  medical_info: {
                    ...(this.activeBeneficiary.health_data?.medical_info || {}),
                    vaccines: updatedVaccines
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
              'Vacunas guardadas correctamente',
              'success'
            );
            this.navCtrl.navigateRoot('/beneficiary/home/vacinations');
          },
          async (error) => {
            console.error('Error al guardar vacunas:', error);
            this.isLoading = false;
            await this.toastService.presentToast(
              'Error al guardar las vacunas',
              'danger'
            );
          }
        );
    } catch (error) {
      console.error('Error al procesar el formulario:', error);
      this.isLoading = false;
      await this.toastService.presentToast(
        'Error al guardar las vacunas',
        'danger'
      );
    }
  }
}