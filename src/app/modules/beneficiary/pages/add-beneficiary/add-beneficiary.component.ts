import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonicModule,
  AlertController,
  LoadingController,
  NavController,
} from '@ionic/angular';
import { debounceTime } from 'rxjs';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { LocationService } from '../../../auth/services/location.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { environment } from 'src/environments/environment';

import { ActivatedRoute } from '@angular/router';
import { CodeService } from 'src/app/core/services/code.service';
@Component({
  selector: 'app-add-beneficiary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TabBarComponent,
    CustomButtonComponent,
  ],
  templateUrl: './add-beneficiary.component.html',
  styleUrls: ['./add-beneficiary.component.scss'],
})
export class AddBeneficiaryComponent implements OnInit {
  public beneficiaryForm: FormGroup;
  public newImage: boolean = false;
  public selectedImage: string | ArrayBuffer | null = null;
  public file_pub_name: any;
  public databs64: any;
  imageLoaded: string = '';
  public code: string = '';
  public buttonBackground: string = 'assets/background/button_primary_bg.png';
  public isEditing: boolean = false;

  // Enhanced error messages with more details
  errorMessages: any = {
    nombre: {
      required: 'El nombre es obligatorio.',
      pattern: 'El nombre solo puede contener letras.',
    },
    apellido: {
      required: 'El apellido es obligatorio.',
      pattern: 'El apellido solo puede contener letras.',
    },
    tipoid: {
      required: 'El tipo de identificación es obligatorio.',
    },
    numeroid: {
      required: 'El número de identificación es obligatorio.',
      pattern: 'El número de identificación debe contener solo números.',
    },
    direccion: {
      required: 'La dirección es obligatoria.',
    },
    departamento: {
      required: 'El departamento es obligatorio.',
    },
    city_id: {
      required: 'La ciudad es obligatoria.',
    },
    telefono: {
      required: 'El teléfono es obligatorio.',
      pattern: 'El teléfono debe contener solo números y guiones.',
    },
    fecha_nacimiento: {
      required: 'La fecha de nacimiento es obligatoria.',
    },
    genero: {
      required: 'El género es obligatorio.',
    },
  };

  public departments: any[] = [];
  public cities: any[] = [];
  public formSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private beneficiaryService: BeneficiaryService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    public navCtrl: NavController,
    private locationService: LocationService,
    private codeService: CodeService
  ) {
    this.code = this.codeService.getInsuranceCode();

    this.beneficiaryForm = this.fb.group({
      id: [''],
      code: [''],
      nombre: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
      ],
      apellido: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
      ],
      tipoid: ['', Validators.required],
      numeroid: [
        '',
        [Validators.required, Validators.pattern('^[0-9]+$')],
      ],
      direccion: ['', Validators.required],
      city_id: ['', Validators.required],
      departamento: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9-]+$')]],
      fecha_nacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      // Health information fields - not required
      rh: [''],
      eps: [''],
      prepagada: [''],
      arl: [''],
      seguro_funerario: [''],
      public_name: ['', Validators.maxLength(50)],
      photourl: [''],
      imagebs64: [''], 
    });

    this.setupRealTimeValidation();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['new']) {
        this.beneficiaryService.setActiveBeneficiary(null);
        this.isEditing = false;
      }
    });

    this.loadDepartments();

    this.beneficiaryForm
      .get('departamento')
      ?.valueChanges.subscribe((departmentId) => {
        if (departmentId) {
          // Solo limpiar city_id si no estamos cargando datos iniciales
          if (!this.isInitialLoad) {
            this.beneficiaryForm.patchValue({ city_id: '' });
          }
          this.loadCities(departmentId);
        }
      });

    this.loadBeneficiaryData();
  }

  // Flag para controlar el cambio inicial al cargar
  private isInitialLoad = false;

  loadBeneficiaryData() {
    const beneficiary = this.beneficiaryService.getActiveBeneficiary();

    if (!beneficiary) {
      this.beneficiaryForm.reset();
      this.beneficiaryForm.patchValue({
        id: '',
        code: this.code
      });
      return;
    }

    this.isEditing = !!beneficiary.id;

    if (beneficiary) {
      this.isInitialLoad = true;
      
      // Convertir departamento a string si es necesario
      if (beneficiary.departamento !== undefined) {
        beneficiary.departamento = Number(beneficiary.departamento);
      }
      
      // Cargar la imagen si existe
      if (beneficiary.photourl) {
        this.imageLoaded = `${environment.url}${beneficiary.photourl.replace(/\\/g, '/')}`;
      }
      
      // Si hay un departamento, primero cargar las ciudades
      if (beneficiary.departamento) {
        this.loadCities(beneficiary.departamento, beneficiary.city_id);
      }
      
      // Actualizar el formulario con todos los datos
      this.beneficiaryForm.patchValue(beneficiary);
      
      setTimeout(() => {
        this.isInitialLoad = false;
      }, 500);
    }
  }

  loadDepartments() {
    this.locationService.fetchDepartments();
    this.locationService.departments$.subscribe((departments) => {
      this.departments = departments;
    });
  }

  loadCities(departmentId: any, cityId?: any) {
    this.locationService.fetchCitiesByDepartment(departmentId);

    this.locationService.cities$.subscribe((cities) => {
      this.cities = cities;

      if (cityId && cities.some(city => city.id === cityId)) {
        setTimeout(() => {
          this.beneficiaryForm.patchValue({ city_id: cityId });
        }, 100);
      }
    });
  }

  setupRealTimeValidation() {
    this.beneficiaryForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.beneficiaryForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: false,
      });
    });
  }

  // Enhanced method to get specific error messages
  getErrorMessage(field: string): string | null {
    const control = this.beneficiaryForm.get(field);
    
    if ((control?.invalid && control?.touched) || (control?.invalid && this.formSubmitted)) {
      const errors = control?.errors || {};
      
      for (const errorType in errors) {
        if (this.errorMessages[field] && this.errorMessages[field][errorType]) {
          return this.errorMessages[field][errorType];
        }
      }
      
      // Generic error message if specific one not found
      return `Por favor, verifique este campo.`;
    }
    
    return null;
  }

  // Check if field has error (for CSS classes)
  hasError(field: string): boolean {
    const control = this.beneficiaryForm.get(field);
    return !!(control?.invalid && (control?.touched || this.formSubmitted));
  }

  async saveBeneficiary() {
    this.formSubmitted = true;
    
    if (this.beneficiaryForm.valid) {
      const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
      await loading.present();

      const beneficiaryData = { ...this.beneficiaryForm.value };
      this.isEditing = !!beneficiaryData.id;
      
      // Asegúrate de que departamento sea string
      if (beneficiaryData.departamento !== undefined) {
        beneficiaryData.departamento = beneficiaryData.departamento.toString();
        beneficiaryData.telefono = beneficiaryData.telefono.toString();
      }
      
      // Solo enviar imagebs64 si hay una nueva imagen
      if (!this.newImage) {
        delete beneficiaryData.imagebs64;
      }
      
      const action$ = this.isEditing
        ? this.beneficiaryService.updateBeneficiary(beneficiaryData.id, beneficiaryData)
        : this.beneficiaryService.addBeneficiary(beneficiaryData);
      
      action$.subscribe(
        async () => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Éxito',
            message: this.isEditing ? 'Beneficiario actualizado correctamente.' : 'Beneficiario agregado correctamente.',
            buttons: ['OK'],
          });
          this.codeService.clearPersonData();
          await alert.present();
          this.navCtrl.navigateRoot('/home/dashboard');
        },
        async (error: any) => {
          console.log("🚀 ~ AddBeneficiaryComponent ~ error:", error);
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: error.message || 'Ha ocurrido un error al guardar los datos',
            buttons: ['OK'],
          });
          await alert.present();
        }
      );
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.beneficiaryForm.controls).forEach(key => {
        this.beneficiaryForm.get(key)?.markAsTouched();
      });
      
      const alert = await this.alertCtrl.create({
        header: 'Formulario Incompleto',
        message: 'Por favor, complete todos los campos requeridos correctamente.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  // Image Controller
  selectImage() {
    document.getElementById('imageInput')?.click();
  }

  async onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      const alert = await this.alertCtrl.create({
        header: 'Formato no válido',
        message: 'Solo se permiten imágenes en formato JPG, PNG o GIF.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      const alert = await this.alertCtrl.create({
        header: 'Archivo demasiado grande',
        message: 'El tamaño máximo permitido es 2MB.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newImage = true;
      this.selectedImage = e.target.result;
      this.beneficiaryForm.patchValue({
        imagebs64: e.target.result,
        public_name: file.name,
      });
    };
    reader.readAsDataURL(file);
  }
}