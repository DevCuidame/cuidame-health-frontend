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
import {
  AlertController,
  LoadingController,
  NavController,
} from '@ionic/angular';
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
  public buttonBackground: string = 'assets/background/button_primary_bg.png';
  public selectedImage: string | ArrayBuffer | null = null;
  public pubname: any;
  public departments: any[] = [];
  public cities: any[] = [];

  errorMessages: any = {
    name: 'El nombre solo puede contener letras.',
    lastname: 'El apellido solo puede contener letras.',
    numberid: 'Debe ser un número válido.',
    phone: 'Debe ser un número de teléfono válido con al menos 10 dígitos.',
    email: 'Ingrese un correo electrónico válido.',
    gender: 'El género es obligatorio.',
    birth_date: 'La fecha de cumpleaños es obligatoria.',
    password:
      'La contraseña debe contener al menos 8 caracteres, una mayúscula y un número.',
    confirmPassword: 'Las contraseñas no coinciden.',
    imagebs64: 'Debe subir una imagen de perfil.',
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private locationService: LocationService,
    private navCtrl: NavController
  ) {
    this.registerForm = this.fb.group(
      {
        name: [
          '',
          [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
        ],
        lastname: [
          '',
          [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
        ],
        typeid: ['', Validators.required],
        numberid: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
        address: ['', Validators.required],
        city_id: [null, Validators.required],
        department: [null, Validators.required], // Solo para UI, no se envia
        gender: ['', Validators.required],
        birth_date: ['', Validators.required],
        phone: [
          '',
          [
            Validators.required,
            Validators.pattern('^[0-9-]+$'),
            Validators.minLength(10),
          ],
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
        pubname: [''],
        imagebs64: ['', Validators.required],
        privacy_policy: [false, Validators.requiredTrue],
      },
      { validator: this.passwordMatchValidator }
    );

    this.setupRealTimeValidation();
  }

  ngOnInit() {
    this.loadDepartments();

    this.registerForm
      .get('password')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.registerForm
          .get('confirmPassword')
          ?.updateValueAndValidity({ onlySelf: true });
      });

    this.registerForm
      .get('confirmPassword')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.registerForm
          .get('confirmPassword')
          ?.updateValueAndValidity({ onlySelf: true });
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

  goToLogin() {
    this.navCtrl.navigateForward('/auth/login');
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
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (this.registerForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Registrando...',
      });
      await loading.present();
      const { confirmPassword, department, privacy_policy, ...registerData } =
        this.registerForm.value;

      registerData.phone = String(registerData.phone);
      const registerPayload = {
        ...registerData,
        city_id: Number(registerData.city_id) || null,
      };

      this.authService.register(registerPayload as RegisterData).subscribe(
        async () => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Registro exitoso',
            message:
              'Tu cuenta ha sido creada con éxito. Por favor, revisa tu correo.',
            buttons: ['OK'],
          });
          this.navCtrl.navigateRoot('/auth/login');
          await alert.present();
          this.registerSuccess.emit();
        },
        async (error) => {
          await loading.dismiss();

          // Usar el mensaje que viene del servicio
          let errorMessage =
            error.message ||
            'Hubo un problema al crear la cuenta. Inténtalo de nuevo.';

          if (
            errorMessage.includes('No logramos registrar tu correo electrónico')
          ) {
            errorMessage =
              'El correo electrónico ya está registrado. Por favor utilice otro.';
          }

          const alert = await this.alertCtrl.create({
            header: 'Error en el registro',
            message: errorMessage,
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

  async optimizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions (max 800px width/height)
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw resized image to canvas
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with reduced quality
          const quality = 0.7; // 70% quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(optimizedDataUrl);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = event.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  async onImageSelected(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    // Validar tipo de archivo
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

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const alert = await this.alertCtrl.create({
        header: 'Archivo demasiado grande',
        message: 'El tamaño máximo permitido es 5MB.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    try {
      // Optimizar la imagen antes de convertirla a base64
      const optimizedImage = await this.optimizeImage(file);

      this.selectedImage = optimizedImage;
      this.registerForm.patchValue({
        imagebs64: optimizedImage,
        pubname: file.name,
      });
    } catch (error) {
      console.error('Error optimizing image:', error);

      // Fallback to standard FileReader if optimization fails
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
        this.registerForm.patchValue({
          imagebs64: e.target.result,
          pubname: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  }
}
