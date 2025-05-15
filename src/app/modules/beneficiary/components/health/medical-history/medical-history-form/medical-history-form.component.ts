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
import { historyTypeOptions, relativeOptions } from 'src/app/core/constants/options';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { InputComponent } from 'src/app/shared/components/input/input.component';

@Component({
  selector: 'app-medical-history-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputComponent,
    CustomButtonComponent,
  ],
  templateUrl: './medical-history-form.component.html',
  styleUrls: ['./medical-history-form.component.scss'],
})
export class MedicalHistoryFormComponent implements OnInit, OnDestroy {
  public activeBeneficiary: Beneficiary | null = null;
  public buttonBackground: string = 'assets/background/button_secondary_bg.png';
  public isLoading: boolean = false;

  public relativeOptions = relativeOptions;
  public historyTypeOptions = historyTypeOptions;

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
      medicalHistory: this.fb.array([]),
      familyHistory: this.fb.array([]),
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

    // Inicializar antecedentes médicos personales
    if (this.activeBeneficiary.health_data?.medical_info?.backgrounds?.length) {
      this.form.setControl(
        'medicalHistory',
        this.fb.array(
          this.activeBeneficiary.health_data.medical_info.backgrounds.map((m) =>
            this.fb.group({
              id: m.id,
              id_paciente: this.activeBeneficiary?.id,
              tipo_antecedente: [m.tipo_antecedente, [Validators.required]],
              descripcion_antecedente: [m.descripcion_antecedente, [Validators.required]],
              fecha_antecedente: [m.fecha_antecedente, [Validators.required]],
            })
          ) || []
        )
      );
    } else {
      this.form.setControl('medicalHistory', this.fb.array([]));
    }

    // Inicializar antecedentes familiares
    if (this.activeBeneficiary.health_data?.medical_info?.familyBackgrounds?.length) {
      this.form.setControl(
        'familyHistory',
        this.fb.array(
          this.activeBeneficiary.health_data.medical_info.familyBackgrounds.map((f) =>
            this.fb.group({
              id: f.id,
              id_paciente: this.activeBeneficiary?.id,
              tipo_antecedente: [f.tipo_antecedente, [Validators.required]],
              parentesco: [f.parentesco, [Validators.required]],
              descripcion_antecedente: [f.descripcion_antecedente, [Validators.required]],
            })
          ) || []
        )
      );
    } else {
      this.form.setControl('familyHistory', this.fb.array([]));
    }
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
      id_paciente: this.activeBeneficiary?.id,
      tipo_antecedente: ['', [Validators.required]],
      descripcion_antecedente: ['', [Validators.required]],
      fecha_antecedente: ['', [Validators.required]],
    });
  }

  newFamilyHistory(): FormGroup {
    return this.fb.group({
      id_paciente: this.activeBeneficiary?.id,
      tipo_antecedente: ['', [Validators.required]],
      parentesco: ['', [Validators.required]],
      descripcion_antecedente: ['', [Validators.required]],
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
    if (!this.form.valid || !this.activeBeneficiary) {
      this.toastService.presentToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }
    
    this.isLoading = true;

    // Procesamos primero los antecedentes médicos personales
    const medicalHistoryPayload = {
      id_paciente: this.activeBeneficiary.id,
      antecedentes: this.medicalHistory.value.map((m: any) => ({
        tipo_antecedente: m.tipo_antecedente,
        descripcion_antecedente: m.descripcion_antecedente,
        fecha_antecedente: m.fecha_antecedente
      }))
    };


    // Procesamos luego los antecedentes familiares
    const familyHistoryPayload = {
      id_paciente: this.activeBeneficiary.id,
      antecedentes_familiares: this.familyHistory.value.map((f: any) => ({
        tipo_antecedente: f.tipo_antecedente,
        parentesco: f.parentesco,
        descripcion_antecedente: f.descripcion_antecedente
      }))
    };


    try {
      // Primero enviamos los antecedentes médicos personales
      this.healthDataService.syncBackgrounds(medicalHistoryPayload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          async (medicalResponse) => {
            
            // Después enviamos los antecedentes familiares
            this.healthDataService.syncFamilyBackgrounds(familyHistoryPayload)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                async (familyResponse) => {
                  
                  // Actualizamos el beneficiario localmente primero
                  if (this.activeBeneficiary?.id) {
                    const updatedHealthData = {
                      ...(this.activeBeneficiary.health_data || {}),
                      medical_info: {
                        ...(this.activeBeneficiary.health_data?.medical_info || {}),
                        backgrounds: medicalResponse.data?.maintained || [],
                        familyBackgrounds: familyResponse.data?.maintained || []
                      }
                    };
                    
                    // Actualizar de manera segura sin causar un ciclo
                    const updatedBeneficiary = {
                      ...this.activeBeneficiary,
                      health_data: updatedHealthData
                    };
                    
                    // Actualizar el beneficiario activo solo una vez al final
                    this.beneficiaryService.setActiveBeneficiary(updatedBeneficiary);
                  }
                  
                  this.isLoading = false;
                  await this.toastService.presentToast(
                    'Antecedentes guardados correctamente',
                    'success'
                  );
                  this.navCtrl.navigateRoot('/beneficiary/home/medical-history');
                },
                async (familyError) => {
                  console.error('Error al guardar antecedentes familiares:', familyError);
                  this.isLoading = false;
                  await this.toastService.presentToast(
                    'Error al guardar antecedentes familiares',
                    'danger'
                  );
                }
              );
          },
          async (medicalError) => {
            console.error('Error al guardar antecedentes médicos:', medicalError);
            this.isLoading = false;
            await this.toastService.presentToast(
              'Error al guardar antecedentes médicos',
              'danger'
            );
          }
        );
    } catch (error) {
      console.error('Error al procesar el formulario:', error);
      this.isLoading = false;
      await this.toastService.presentToast(
        'Error al guardar los antecedentes',
        'danger'
      );
    }
  }
}