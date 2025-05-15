import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
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
import { ToastService } from 'src/app/core/services/toast.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { CommonModule } from '@angular/common';
import { InputComponent } from 'src/app/shared/components/input/input.component';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';

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
  public buttonBackground: string = 'assets/background/button_secondary_bg.png';
  public isFemale: boolean = false;
  public isLoading: boolean = false;

  // Utilizado para manejar la finalización de suscripciones
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
      diseases: this.fb.array([]),
      disabilities: this.fb.array([]),
      cicatrices: this.fb.control(''),
      tatuajes: this.fb.control(''),
      embarazada: this.fb.control({ value: '', disabled: true }),
    });

    // Suscribirse al beneficiario activo
    this.beneficiaryService.activeBeneficiary$
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.handleBeneficiaryChange.bind(this));

    // Suscribirse al estado de carga
    this.healthDataService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLoading: any) => {
        this.isLoading = isLoading;
      });
  }

  ngOnInit() {}

  ngOnDestroy() {
    // Limpiar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja cambios en el beneficiario activo
   */
  private handleBeneficiaryChange(beneficiary: Beneficiary | null): void {
    if (!beneficiary) return;

    this.activeBeneficiary = beneficiary;

    // Verificar género
    this.isFemale =
      this.activeBeneficiary?.genero?.toLowerCase() === 'femenino';

    if (this.isFemale) {
      this.form.get('embarazada')?.enable();
    } else {
      this.form.get('embarazada')?.disable();
    }

    // Cargar datos de salud si no existen o están incompletos
    this.loadHealthData();
  }

  /**
   * Carga los datos de salud del beneficiario activo
   */
  private loadHealthData(): void {
    if (!this.activeBeneficiary?.id) return;

    this.healthDataService.getHealthData(this.activeBeneficiary.id).subscribe(
      (healthData: any) => {
        if (healthData) {
          // Actualizar datos de salud en el beneficiario activo
          if (!this.activeBeneficiary!.health_data) {
            this.activeBeneficiary!.health_data = healthData;
          } else {
            this.activeBeneficiary!.health_data = healthData;
          }

          // Inicializar formulario con datos actualizados
          this.initializeForm();
        }
      },
      (error: any) => {
        console.error('Error al cargar datos de salud:', error);
        // Intentar inicializar el formulario con lo que tengamos
        this.initializeForm();
      }
    );
  }

  /**
   * Inicializa el formulario con los datos del beneficiario
   */
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
    if (condition) {
      // Inicializar discapacidad
      if (condition.discapacidad) {
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

      // Inicializar campos individuales
      this.form.patchValue({
        cicatrices: condition.cicatrices_descripcion || '',
        tatuajes: condition.tatuajes_descripcion || '',
        embarazada: condition.embarazada || '',
      });
    }
  }

  /**
   * Valida si el formulario tiene al menos un campo con información
   */
  isFormValid(): boolean {
    return (
      (this.diseases.length > 0 && this.diseases.valid) ||
      (this.disabilities.length > 0 && this.disabilities.valid) ||
      !!this.getFormControl(this.form, 'cicatrices').value ||
      !!this.getFormControl(this.form, 'tatuajes').value ||
      (this.isFemale && !!this.getFormControl(this.form, 'embarazada').value)
    );
  }

  get diseases(): FormArray {
    return this.form.get('diseases') as FormArray;
  }

  get disabilities(): FormArray {
    return this.form.get('disabilities') as FormArray;
  }

  getDiseaseFormGroup(index: number): FormGroup {
    return this.diseases.at(index) as FormGroup;
  }

  getDisabilityFormGroup(index: number): FormGroup {
    return this.disabilities.at(index) as FormGroup;
  }

  getFormControl(
    form: FormGroup | AbstractControl,
    fieldName: string
  ): FormControl {
    return form.get(fieldName) as FormControl;
  }

  /**
   * Crea un nuevo grupo de formulario para una enfermedad
   */
  newDisease(): FormGroup {
    return this.fb.group({
      id_paciente: this.activeBeneficiary?.id,
      enfermedad: ['', [Validators.required]],
    });
  }

  /**
   * Crea un nuevo grupo de formulario para una discapacidad
   */
  newDisability(): FormGroup {
    return this.fb.group({
      id_paciente: this.activeBeneficiary?.id,
      name: ['', [Validators.required]],
    });
  }

  /**
   * Agrega una nueva enfermedad al formulario
   */
  addDisease() {
    this.diseases.push(this.newDisease());
    this.form.updateValueAndValidity();
  }

  /**
   * Elimina una enfermedad del formulario
   */
  removeDisease(index: number) {
    this.diseases.removeAt(index);
    this.form.updateValueAndValidity();
  }

  /**
   * Agrega una nueva discapacidad al formulario
   * Solo permite una discapacidad
   */
  addDisability() {
    // Solo permitir una discapacidad
    if (this.disabilities.length === 0) {
      this.disabilities.push(this.newDisability());
      this.form.updateValueAndValidity();
    }
  }

  /**
   * Elimina una discapacidad del formulario
   */
  removeDisability(index: number) {
    this.disabilities.removeAt(index);
    this.form.updateValueAndValidity();
  }

  /**
   * Envía el formulario con los datos de condición médica y enfermedades
   */
  async submitForm() {
    if (!this.form.valid || !this.activeBeneficiary?.id) {
      this.toastService.presentToast(
        'Por favor complete correctamente los campos requeridos',
        'warning'
      );
      return;
    }

    // 1. Preparar datos de enfermedades
    const diseasesPayload = {
      id_paciente: this.activeBeneficiary.id,
      enfermedades: this.diseases.value.map((d: any) => ({
        enfermedad: d.enfermedad,
      })),
    };

    // 2. Preparar datos de condición médica
    const conditionPayload = {
      id_paciente: this.activeBeneficiary.id,
      discapacidad:
        this.disabilities.length > 0
          ? this.disabilities.at(0).get('name')?.value
          : null,
      cicatrices_descripcion:
        this.getFormControl(this.form, 'cicatrices').value || null,
      tatuajes_descripcion:
        this.getFormControl(this.form, 'tatuajes').value || null,
      embarazada: this.isFemale
        ? this.getFormControl(this.form, 'embarazada').value || null
        : null,
    };

    // 3. Sincronizar enfermedades primero
    this.healthDataService.syncDiseases(diseasesPayload).subscribe(
      async (diseasesResponse: any) => {
        // 4. Luego guardar condición médica
        this.healthDataService.saveHealthCondition(conditionPayload).subscribe(
          async (conditionResponse: any) => {
            // 5. Actualizar datos en el beneficiario activo
            if (this.activeBeneficiary) {
              // Asegurar que los datos locales estén actualizados
              // El servicio ya ha actualizado la caché, así que obtenemos los datos más recientes
              this.healthDataService
                .getHealthData(this.activeBeneficiary.id, false, false)
                .subscribe(
                  (healthData: any) => {
                    if (healthData && this.activeBeneficiary) {
                      // Actualizar datos de salud en el beneficiario activo
                      this.activeBeneficiary.health_data = healthData;

                      // Actualizar beneficiario activo en el servicio
                      this.beneficiaryService.setActiveBeneficiary(
                        this.activeBeneficiary
                      );

                      // Mostrar mensaje de éxito
                      this.toastService.presentToast(
                        'Datos de salud guardados correctamente',
                        'success'
                      );

                      // Navegar de vuelta
                      this.navCtrl.navigateRoot('/beneficiary/home/conditions');
                    }
                  },
                  (error: any) => {
                    console.error('Error al recargar datos de salud:', error);
                    this.toastService.presentToast(
                      'Datos guardados, pero hubo un error al actualizar la información local',
                      'warning'
                    );
                    this.navCtrl.navigateRoot('/beneficiary/home/conditions');
                  }
                );
            }
          },
          (error: any) => {
            console.error('Error al guardar condición médica:', error);
            this.toastService.presentToast(
              'Error al guardar condición médica',
              'danger'
            );
          }
        );
      },
      (error: any) => {
        console.error('Error al sincronizar enfermedades:', error);
        this.toastService.presentToast(
          'Error al guardar enfermedades',
          'danger'
        );
      }
    );
  }
}
