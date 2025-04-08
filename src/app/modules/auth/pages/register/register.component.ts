// src/app/modules/auth/pages/register/register.page.ts
import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegisterData } from 'src/app/core/interfaces/auth.interface';
import { AlertController, LoadingController } from '@ionic/angular';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CustomButtonComponent,
  ], 
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  @Output() registerSuccess = new EventEmitter<void>();
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  registerForm: FormGroup;
  public buttonBackground: string = 'assets/background/primary_button_bg.svg';
  public selectedImage: string | ArrayBuffer | null = null;
  public file_pub_name: any;
  public departments: any[] = [];
  public cities: any[] = [];

  errorMessages: any = {
    first_name: 'El nombre solo puede contener letras.',
    last_name: 'El apellido solo puede contener letras.',
    identification_number: 'Debe ser un número válido.',
    phone: 'Debe ser un número de teléfono válido con al menos 10 dígitos.',
    email: 'Ingrese un correo electrónico válido.',
    gender: 'El género es obligatorio.',
    birthdate: 'La fecha de cumpleaños es obligatoria.',
    password:
      'La contraseña debe contener al menos 8 caracteres, una mayúscula y un número.',
    confirmPassword: 'Las contraseñas no coinciden.',
    base_64: 'Debe subir una imagen de perfil.'
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private locationService: LocationService
  ) {
    this.registerForm = this.fb.group(
      {
        first_name: [
          '',
          [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
        ],
        last_name: [
          '',
          [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
        ],
        identification_type: ['', Validators.required],
        identification_number: [
          '',
          [Validators.required, Validators.pattern('^[0-9]+$')],
        ],
        address: ['', Validators.required],
        city: [null, Validators.required],
        department: [null, Validators.required],
        gender: ['', Validators.required],
        birth_date: ['', Validators.required],
        phone: [
          '', 
          [
            Validators.required, 
            Validators.pattern('^[0-9-]+$'),
            Validators.minLength(10) 
          ]
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$'
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        public_name: [''],
        base_64: ['', Validators.required],
        privacy_policy: [false, Validators.requiredTrue],
      },
      { validator: this.passwordMatchValidator }
    );

    this.setupRealTimeValidation();
  }

  ngOnInit() {
    this.loadDepartments();
    console.log(this.departments);

  this.registerForm.get('password')?.valueChanges
  .pipe(debounceTime(300), distinctUntilChanged())
  .subscribe(() => {
    this.registerForm.get('confirmPassword')?.updateValueAndValidity({ onlySelf: true });
  });

this.registerForm.get('confirmPassword')?.valueChanges
  .pipe(debounceTime(300), distinctUntilChanged())
  .subscribe(() => {
    this.registerForm.get('confirmPassword')?.updateValueAndValidity({ onlySelf: true });
  });

    this.registerForm
      .get('department')
      ?.valueChanges.subscribe((departmentId) => {
        this.loadCities(departmentId);
      });
  }

  loadDepartments() {
    this.locationService.fetchDepartments();
    this.locationService.departments$.subscribe((departments) => {
      this.departments = departments;
    });
  }

  loadCities(departmentId: number) {
    this.locationService.fetchCitiesByDepartment(departmentId);
    this.locationService.cities$.subscribe((cities) => {
      this.cities = cities;
    });
  }
  setupRealTimeValidation() {
    this.registerForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.registerForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: false,
      });
    });
  }
  passwordMatchValidator(formGroup: FormGroup): null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword');

    if (!confirmPassword) return null;

    if (confirmPassword.value && confirmPassword.value !== password) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }

    return null;
  }



  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  getErrorMessage(field: string): string | null {
    if (
      this.registerForm.get(field)?.invalid &&
      this.registerForm.get(field)?.touched
    ) {
      return this.errorMessages[field];
    }
    return null;
  }

  async register() {

    if (!this.selectedImage) {
      const alert = await this.alertCtrl.create({
        header: 'Falta imagen',
        message: 'Por favor, carga una imagen antes de continuar.',
        buttons: ['OK']
      });
      await alert.present();
      return; 
    }

    if (this.registerForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Registrando...',
      });
      await loading.present();
      const { confirmPassword, ...registerData } = this.registerForm.value;

      registerData.phone = String(registerData.phone);
      const registerPayload = {
        ...registerData,
        city_id: Number(registerData.city) || null,
      };
      delete registerPayload.city;

      this.authService.register(registerPayload as RegisterData).subscribe(
        async () => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Registro exitoso',
            message:
              'Tu cuenta ha sido creada con éxito. Por favor, revisa tu correo.',
            buttons: ['OK'],
          });
          await alert.present();
          this.registerSuccess.emit();
        },
        async (error) => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Error en el registro',
            message: 'Hubo un problema al crear la cuenta. Inténtalo de nuevo.',
            buttons: ['OK'],
          });
          await alert.present();
          console.error('Error en el registro:', error);
        }
      );
    }
  }

  // Image Controller

  selectImage() {
    document.getElementById('imageInput')?.click();
  }

  async onImageSelected(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    // Validar tipo de archivo (aceptamos HEIC, JPEG, PNG y GIF)
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/heic',
      'image/heif',
    ];
    if (!validTypes.includes(file.type)) {
      const alert = await this.alertCtrl.create({
        header: 'Formato no válido',
        message: 'Solo se permiten imágenes en formato JPG, PNG, GIF o HEIC.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 5 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      const alert = await this.alertCtrl.create({
        header: 'Archivo demasiado grande',
        message: 'El tamaño máximo permitido es 2MB.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
    // Convertir imagen a base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedImage = e.target.result;
      this.registerForm.patchValue({
        base_64: e.target.result,
        public_name: file.name,
      });
    };
    reader.readAsDataURL(file);
  }
}
