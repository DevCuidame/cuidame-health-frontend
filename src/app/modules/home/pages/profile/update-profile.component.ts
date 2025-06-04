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
import { environment } from 'src/environments/environment';
import { User } from 'src/app/core/interfaces/auth.interface'; // Importar interfaz User
import { UserService } from 'src/app/modules/auth/services/user.service';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TabBarComponent,
    CustomButtonComponent,
  ],
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.scss'],
})
export class UpdateProfileComponent implements OnInit {
  public profileForm: FormGroup; // Cambio de nombre
  public newImage: boolean = false;
  public selectedImage: string | ArrayBuffer | null = null;
  public file_pub_name: any;
  public databs64: any;
  imageLoaded: string = '';
  public buttonBackground: string = 'assets/background/button_primary_bg.png';
  public isEditing: boolean = true; // Siempre estamos editando el perfil

  // Mensajes de error adaptados para perfil de usuario
  errorMessages: any = {
    name: {
      required: 'El nombre es obligatorio.',
      pattern: 'El nombre solo puede contener letras.',
    },
    lastname: {
      required: 'El apellido es obligatorio.',
      pattern: 'El apellido solo puede contener letras.',
    },
    typeid: {
      required: 'El tipo de identificación es obligatorio.',
    },
    numberid: {
      required: 'El número de identificación es obligatorio.',
      pattern: 'El número de identificación debe contener solo números.',
    },
    address: {
      required: 'La dirección es obligatoria.',
    },
    department: {
      required: 'El departamento es obligatorio.',
    },
    city_id: {
      required: 'La ciudad es obligatoria.',
    },
    phone: {
      required: 'El teléfono es obligatorio.',
      pattern: 'El teléfono debe contener solo números y guiones.',
      minLength: 'El teléfono debe tener al menos 10 dígitos.',
    },
    birth_date: {
      required: 'La fecha de nacimiento es obligatoria.',
    },
    gender: {
      required: 'El género es obligatorio.',
    },
  };

  public departments: any[] = [];
  public cities: any[] = [];
  public formSubmitted = false;
  public currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService, // Cambio aquí
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    public navCtrl: NavController,
    private locationService: LocationService
  ) {
    // Formulario adaptado para usuario (basado en register component)
    this.profileForm = this.fb.group({
      id: [''],
      name: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
      ],
      lastname: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')],
      ],
      typeid: ['', Validators.required],
      numberid: [
        '',
        [Validators.required, Validators.pattern('^[0-9]+$')],
      ],
      address: ['', Validators.required],
      city_id: ['', Validators.required],
      department: ['', Validators.required], // Para UI, las ciudades dependen del departamento
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9-]+$'),
          Validators.minLength(10),
        ],
      ],
      birth_date: ['', Validators.required],
      gender: ['', Validators.required],
      imagebs64: [''], 
    });

    this.setupRealTimeValidation();
  }

  ngOnInit() {
    this.loadDepartments();

    // Configurar cambios de departamento para cargar ciudades
    this.profileForm
      .get('department')
      ?.valueChanges.subscribe((departmentId) => {
        if (departmentId) {
          // Solo limpiar city_id si no estamos cargando datos iniciales
          if (!this.isInitialLoad) {
            this.profileForm.patchValue({ city_id: '' });
          }
          this.loadCities(departmentId);
        }
      });

    this.loadUserData();
  }

  // Flag para controlar el cambio inicial al cargar
  private isInitialLoad = false;

  loadUserData() {
    // Obtener usuario actual del servicio
    this.currentUser = this.userService.getUser();

    if (!this.currentUser) {
      // Si no hay usuario, redirigir al login
      this.navCtrl.navigateRoot('/auth/login');
      return;
    }

    this.isInitialLoad = true;
    
    // Normalizar usuario si es un array (basado en el código del UserService)
    let userData = this.currentUser;
    if (Array.isArray(this.currentUser)) {
      userData = this.currentUser[0];
    }

    // Extraer departamento del campo city_id o location si existe
    let departmentId = null;
    if (userData.department) {
      departmentId = userData.department;
    }

    // Cargar la imagen si existe
    if (userData.path) {
      this.imageLoaded = `${environment.url}${userData.path.replace(/\\/g, '/')}`;
    }
    
    // Si hay un departamento, primero cargar las ciudades
    if (departmentId) {
      this.loadCities(departmentId, userData.city_id);
    }
    
    // Mapear datos del usuario al formulario
    this.profileForm.patchValue({
      id: userData.id || '',
      name: userData.name || '',
      lastname: userData.lastname || '',
      typeid: userData.typeid || '',
      numberid: userData.numberid || '',
      address: userData.address || '',
      city_id: userData.city_id || '',
      department: departmentId || '',
      phone: userData.phone || '',
      birth_date: userData.birth_date || '',
      gender: userData.gender || '',
      pubname: userData.pubname || '',
    });
    
    setTimeout(() => {
      this.isInitialLoad = false;
    }, 500);
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
          this.profileForm.patchValue({ city_id: cityId });
        }, 100);
      }
    });
  }

  setupRealTimeValidation() {
    this.profileForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.profileForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: false,
      });
    });
  }

  // Método mejorado para obtener mensajes de error específicos
  getErrorMessage(field: string): string | null {
    const control = this.profileForm.get(field);
    
    if ((control?.invalid && control?.touched) || (control?.invalid && this.formSubmitted)) {
      const errors = control?.errors || {};
      
      for (const errorType in errors) {
        if (this.errorMessages[field] && this.errorMessages[field][errorType]) {
          return this.errorMessages[field][errorType];
        }
      }
      
      // Mensaje de error genérico si no se encuentra uno específico
      return `Por favor, verifique este campo.`;
    }
    
    return null;
  }

  // Verificar si el campo tiene error (para clases CSS)
  hasError(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control?.invalid && (control?.touched || this.formSubmitted));
  }

  async saveProfile() { // Cambio de nombre del método
    this.formSubmitted = true;
    
    if (this.profileForm.valid) {
      const loading = await this.loadingCtrl.create({ message: 'Actualizando perfil...' });
      await loading.present();

      const profileData = { ...this.profileForm.value };
      
      // Asegurar que phone sea string y remover department (solo para UI)
      if (profileData.phone !== undefined) {
        profileData.phone = profileData.phone.toString();
      }
      
      // Remover department ya que es solo para la UI
      delete profileData.department;
      
      // Solo enviar imagebs64 si hay una nueva imagen
      if (!this.newImage) {
        delete profileData.imagebs64;
      }
      
      // Usar el servicio de usuario para actualizar el perfil
      this.userService.updateProfile(profileData).subscribe(
        async (response) => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Éxito',
            message: 'Perfil actualizado correctamente.',
            buttons: ['OK'],
          });
          await alert.present();
          
          // Refrescar datos del usuario
          if (this.currentUser?.id) {
            this.userService.refreshUserData(this.currentUser.id).subscribe();
          }
          
          // Navegar de vuelta al dashboard o perfil
          this.navCtrl.navigateRoot('/home/dashboard');
        },
        async (error: any) => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: error.message || 'Ha ocurrido un error al actualizar el perfil',
            buttons: ['OK'],
          });
          await alert.present();
        }
      );
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      
      const alert = await this.alertCtrl.create({
        header: 'Formulario Incompleto',
        message: 'Por favor, complete todos los campos requeridos correctamente.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  // Controlador de imagen (mantiene la misma lógica)
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
      this.profileForm.patchValue({
        imagebs64: e.target.result,
        pubname: file.name,
      });
    };
    reader.readAsDataURL(file);
  }
}