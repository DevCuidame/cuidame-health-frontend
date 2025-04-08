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
  public buttonBackground: string = 'assets/background/secondary_button_bg.svg';

  errorMessages: any = {
    first_name: 'El nombre solo puede contener letras.',
    last_name: 'El apellido solo puede contener letras.',
    identification_number: 'Debe ser un número válido.',
    phone: 'Debe ser un número de teléfono válido.',
  };

  public departments: any[] = [];
  public cities: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private beneficiaryService: BeneficiaryService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    public navCtrl: NavController,
    private locationService: LocationService
  ) {
    this.beneficiaryForm = this.fb.group({
      id: [''],
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
      rh: [''],
      eps: [''],
      prepagada: [''],
      arl: [''],
      seguro_funerario: [''],
      public_name: ['', Validators.maxLength(50)],
      photourl: [''],
    });

    this.setupRealTimeValidation();
  }

  ngOnInit() {

    this.route.queryParams.subscribe(params => {
      if (params['new']) {
        this.beneficiaryService.setActiveBeneficiary(null);
      }
    });

    this.loadDepartments();

    this.beneficiaryForm
      .get('department')
      ?.valueChanges.subscribe((departmentId) => {
        if (departmentId) {
          this.beneficiaryForm.patchValue({ city_id: '' });
          this.loadCities(departmentId);
        }
      });

    this.loadBeneficiaryData();
  }

  loadBeneficiaryData() {
    const beneficiary = this.beneficiaryService.getActiveBeneficiary();

    if (!beneficiary) {
      this.beneficiaryForm.reset();
      this.beneficiaryForm.patchValue({
        id: ''
      });
      return;
    }

    if (beneficiary) {
      this.beneficiaryForm.patchValue(beneficiary);

      this.imageLoaded = beneficiary.imagebs64
        ? `${environment.url}${beneficiary.imagebs64.replace('\\', '/')}`
        : '';

      this.locationService.fetchDepartments();
      this.locationService.departments$.subscribe((departments) => {
        this.departments = departments;
      });
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

  getErrorMessage(field: string): string | null {
    if (
      this.beneficiaryForm.get(field)?.invalid &&
      this.beneficiaryForm.get(field)?.touched
    ) {
      return this.errorMessages[field];
    }
    return null;
  }

  async saveBeneficiary() {
    if (this.beneficiaryForm.valid) {
      const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
      await loading.present();

      const beneficiaryData = { ...this.beneficiaryForm.value };
      const isEditing = !!beneficiaryData.id;

      const action$ = isEditing
        ? this.beneficiaryService.updateBeneficiary(beneficiaryData.id, beneficiaryData)
        : this.beneficiaryService.addBeneficiary(beneficiaryData);

      action$.subscribe(
        async () => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Éxito',
            message: isEditing ? 'Beneficiario actualizado correctamente.' : 'Beneficiario agregado correctamente.',
            buttons: ['OK'],
          });
          await alert.present();
          this.navCtrl.navigateRoot('/home/dashboard');
        },
        async (error: any) => {
          console.log("🚀 ~ AddBeneficiaryComponent ~ error:", error)
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: error.message,
            buttons: ['OK'],
          });
          await alert.present();
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
        base_64: e.target.result,
        public_name: file.name,
      });
    };
    reader.readAsDataURL(file);
  }
}
