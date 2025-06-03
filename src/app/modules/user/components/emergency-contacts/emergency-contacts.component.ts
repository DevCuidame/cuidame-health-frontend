import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { EmergencyContactsService } from 'src/app/core/services/emergency-contacts.service';
import { UserService } from '../../../auth/services/user.service';

@Component({
  selector: 'app-emergency-contacts',
  template: `
    <div class="contacts-container" [class.desktop-mode]="isDesktop">
      <div class="header-section" *ngIf="!hideHeaderInDesktop">
        <h2>Contactos de Emergencia</h2>
        <p class="description">Registra hasta 3 contactos de emergencia para que puedan ser notificados en caso necesario.</p>
      </div>
    
      <div *ngIf="isLoading" class="loader">
        <ion-spinner name="circular"></ion-spinner>
        <p>Cargando contactos...</p>
      </div>
    
      <div *ngIf="!isLoading" class="contacts-form">
        <form [formGroup]="contactsForm" (ngSubmit)="saveContacts()">
          <!-- Contacto 1 -->
          <div class="contact-card" [class.filled]="hasContact(1)">
            <div class="contact-header">
              <div class="header-content">
                <ion-icon name="person-circle-outline" class="contact-icon primary"></ion-icon>
                <div class="header-text">
                  <h3>Contacto Principal</h3>
                  <span class="contact-priority">Prioritario</span>
                </div>
              </div>
              <ion-icon 
                *ngIf="hasContact(1)"
                name="trash-outline" 
                class="delete-icon" 
                (click)="deleteContact(1)"
                title="Eliminar contacto">
              </ion-icon>
            </div>
            <div class="contact-fields">
              <div class="form-group">
                <label for="nombre1">
                  <ion-icon name="person-outline"></ion-icon>
                  Nombre completo
                </label>
                <input 
                  type="text" 
                  id="nombre1" 
                  formControlName="nombre1" 
                  placeholder="Ej: María García López"
                  [class.error]="formErrors.nombre1">
                <small *ngIf="formErrors.nombre1" class="error-message">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  {{formErrors.nombre1}}
                </small>
              </div>
              <div class="form-group">
                <label for="telefono1">
                  <ion-icon name="call-outline"></ion-icon>
                  Teléfono
                </label>
                <input 
                  type="tel" 
                  id="telefono1" 
                  formControlName="telefono1" 
                  placeholder="Ej: 3001234567"
                  [class.error]="formErrors.telefono1">
                <small *ngIf="formErrors.telefono1" class="error-message">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  {{formErrors.telefono1}}
                </small>
              </div>
            </div>
          </div>
          
          <!-- Contacto 2 -->
          <div class="contact-card" [class.filled]="hasContact(2)">
            <div class="contact-header">
              <div class="header-content">
                <ion-icon name="person-circle-outline" class="contact-icon secondary"></ion-icon>
                <div class="header-text">
                  <h3>Contacto Secundario</h3>
                  <span class="contact-priority">Alternativo</span>
                </div>
              </div>
              <ion-icon 
                *ngIf="hasContact(2)"
                name="trash-outline" 
                class="delete-icon" 
                (click)="deleteContact(2)"
                title="Eliminar contacto">
              </ion-icon>
            </div>
            <div class="contact-fields">
              <div class="form-group">
                <label for="nombre2">
                  <ion-icon name="person-outline"></ion-icon>
                  Nombre completo
                </label>
                <input 
                  type="text" 
                  id="nombre2" 
                  formControlName="nombre2" 
                  placeholder="Ej: Carlos Rodríguez Pérez"
                  [class.error]="formErrors.nombre2">
                <small *ngIf="formErrors.nombre2" class="error-message">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  {{formErrors.nombre2}}
                </small>
              </div>
              <div class="form-group">
                <label for="telefono2">
                  <ion-icon name="call-outline"></ion-icon>
                  Teléfono
                </label>
                <input 
                  type="tel" 
                  id="telefono2" 
                  formControlName="telefono2" 
                  placeholder="Ej: 3009876543"
                  [class.error]="formErrors.telefono2">
                <small *ngIf="formErrors.telefono2" class="error-message">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  {{formErrors.telefono2}}
                </small>
              </div>
            </div>
          </div>
          
          <!-- Contacto 3 -->
          <div class="contact-card" [class.filled]="hasContact(3)">
            <div class="contact-header">
              <div class="header-content">
                <ion-icon name="person-circle-outline" class="contact-icon additional"></ion-icon>
                <div class="header-text">
                  <h3>Contacto Adicional</h3>
                  <span class="contact-priority">Opcional</span>
                </div>
              </div>
              <ion-icon 
                *ngIf="hasContact(3)"
                name="trash-outline" 
                class="delete-icon" 
                (click)="deleteContact(3)"
                title="Eliminar contacto">
              </ion-icon>
            </div>
            <div class="contact-fields">
              <div class="form-group">
                <label for="nombre3">
                  <ion-icon name="person-outline"></ion-icon>
                  Nombre completo
                </label>
                <input 
                  type="text" 
                  id="nombre3" 
                  formControlName="nombre3" 
                  placeholder="Ej: Ana Martínez Sánchez"
                  [class.error]="formErrors.nombre3">
                <small *ngIf="formErrors.nombre3" class="error-message">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  {{formErrors.nombre3}}
                </small>
              </div>
              <div class="form-group">
                <label for="telefono3">
                  <ion-icon name="call-outline"></ion-icon>
                  Teléfono
                </label>
                <input 
                  type="tel" 
                  id="telefono3" 
                  formControlName="telefono3" 
                  placeholder="Ej: 3155647382"
                  [class.error]="formErrors.telefono3">
                <small *ngIf="formErrors.telefono3" class="error-message">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  {{formErrors.telefono3}}
                </small>
              </div>
            </div>
          </div>
    
          <div class="contact-validation-error" *ngIf="formErrors.general">
            <ion-icon name="alert-circle" class="error-icon"></ion-icon>
            <div class="error-content">
              <strong>Error de validación</strong>
              <span>{{formErrors.general}}</span>
            </div>
          </div>

          <!-- Información útil -->
          <div class="info-section" *ngIf="isDesktop">
            <div class="info-card">
              <ion-icon name="information-circle-outline" class="info-icon"></ion-icon>
              <div class="info-content">
                <h4>¿Por qué es importante?</h4>
                <p>Los contactos de emergencia serán notificados automáticamente en caso de situaciones críticas o emergencias médicas.</p>
              </div>
            </div>
          </div>
    
          <div class="buttons-container">
            <button 
              type="submit" 
              [disabled]="isSaving || !isFormValid()" 
              class="save-button">
              <ion-icon name="save-outline" *ngIf="!isSaving"></ion-icon>
              <ion-spinner *ngIf="isSaving" name="circular" class="spinner-button"></ion-spinner>
              <span *ngIf="!isSaving">Guardar Contactos</span>
              <span *ngIf="isSaving">Guardando...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./emergency-contacts.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class EmergencyContactsComponent implements OnInit, OnDestroy {
  contactsForm: FormGroup;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isDesktop: boolean = false;
  hideHeaderInDesktop: boolean = false;
  private subscriptions: Subscription = new Subscription();
  
  formErrors: {
    nombre1?: string;
    telefono1?: string;
    nombre2?: string;
    telefono2?: string;
    nombre3?: string;
    telefono3?: string;
    general?: string;
  } = {};

  constructor(
    private fb: FormBuilder,
    private contactsService: EmergencyContactsService,
    private userService: UserService,
    private toastCtrl: ToastController
  ) {
    this.contactsForm = this.fb.group({
      nombre1: ['', []],
      telefono1: ['', []],
      nombre2: ['', []],
      telefono2: ['', []],
      nombre3: ['', []],
      telefono3: ['', []]
    });
    
    this.checkScreenSize();
    this.checkIfDesktopShouldHideHeader();
  }

  ngOnInit() {
    this.loadContacts();
    this.setupFormValidation();
    this.setupResizeListener();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private checkScreenSize() {
    this.isDesktop = window.innerWidth > 768;
  }

  private checkIfDesktopShouldHideHeader() {
    // En desktop, si viene de un layout que ya tiene header, ocultarlo
    this.hideHeaderInDesktop = this.isDesktop;
  }

  private setupResizeListener() {
    const resizeSubscription = new Subscription();
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
    this.subscriptions.add(resizeSubscription);
  }

  /**
   * Configura la validación del formulario para detectar errores en tiempo real
   */
  setupFormValidation() {
    const phoneRegex = /^\d{7,15}$/;
    
    // Validar nombre1 cuando telefono1 tiene contenido
    const telefono1Sub = this.contactsForm.get('telefono1')?.valueChanges.subscribe(value => {
      const nombre1Control = this.contactsForm.get('nombre1');
      if (value && value.trim()) {
        nombre1Control?.setValidators([Validators.required]);
      } else {
        nombre1Control?.clearValidators();
      }
      nombre1Control?.updateValueAndValidity();
    });

    // Validar telefono1 cuando nombre1 tiene contenido
    const nombre1Sub = this.contactsForm.get('nombre1')?.valueChanges.subscribe(value => {
      const telefono1Control = this.contactsForm.get('telefono1');
      if (value && value.trim()) {
        telefono1Control?.setValidators([Validators.required, Validators.pattern(phoneRegex)]);
      } else {
        telefono1Control?.clearValidators();
      }
      telefono1Control?.updateValueAndValidity();
    });

    // Validar nombre2 cuando telefono2 tiene contenido
    const telefono2Sub = this.contactsForm.get('telefono2')?.valueChanges.subscribe(value => {
      const nombre2Control = this.contactsForm.get('nombre2');
      if (value && value.trim()) {
        nombre2Control?.setValidators([Validators.required]);
      } else {
        nombre2Control?.clearValidators();
      }
      nombre2Control?.updateValueAndValidity();
    });

    // Validar telefono2 cuando nombre2 tiene contenido
    const nombre2Sub = this.contactsForm.get('nombre2')?.valueChanges.subscribe(value => {
      const telefono2Control = this.contactsForm.get('telefono2');
      if (value && value.trim()) {
        telefono2Control?.setValidators([Validators.required, Validators.pattern(phoneRegex)]);
      } else {
        telefono2Control?.clearValidators();
      }
      telefono2Control?.updateValueAndValidity();
    });

    // Validar nombre3 cuando telefono3 tiene contenido
    const telefono3Sub = this.contactsForm.get('telefono3')?.valueChanges.subscribe(value => {
      const nombre3Control = this.contactsForm.get('nombre3');
      if (value && value.trim()) {
        nombre3Control?.setValidators([Validators.required]);
      } else {
        nombre3Control?.clearValidators();
      }
      nombre3Control?.updateValueAndValidity();
    });

    // Validar telefono3 cuando nombre3 tiene contenido
    const nombre3Sub = this.contactsForm.get('nombre3')?.valueChanges.subscribe(value => {
      const telefono3Control = this.contactsForm.get('telefono3');
      if (value && value.trim()) {
        telefono3Control?.setValidators([Validators.required, Validators.pattern(phoneRegex)]);
      } else {
        telefono3Control?.clearValidators();
      }
      telefono3Control?.updateValueAndValidity();
    });

    // Actualizar errores cuando cambian los valores
    const formSub = this.contactsForm.valueChanges.subscribe(() => {
      this.updateFormErrors();
    });

    // Agregar todas las suscripciones
    if (telefono1Sub) this.subscriptions.add(telefono1Sub);
    if (nombre1Sub) this.subscriptions.add(nombre1Sub);
    if (telefono2Sub) this.subscriptions.add(telefono2Sub);
    if (nombre2Sub) this.subscriptions.add(nombre2Sub);
    if (telefono3Sub) this.subscriptions.add(telefono3Sub);
    if (nombre3Sub) this.subscriptions.add(nombre3Sub);
    if (formSub) this.subscriptions.add(formSub);
  }

  /**
   * Carga los contactos del usuario actual
   */
  loadContacts() {
    const user = this.userService.getUser();
    if (!user || !user.id) {
      this.isLoading = false;
      this.presentToast('No se pudo obtener información del usuario', 'danger');
      return;
    }

    this.contactsService.getMyContacts()
      .pipe(
        tap((response: any) => {
          if (response && response.data) {
            const contactData = response.data;
            this.contactsForm.patchValue({
              nombre1: contactData.nombre1 || '',
              telefono1: contactData.telefono1 || '',
              nombre2: contactData.nombre2 || '',
              telefono2: contactData.telefono2 || '',
              nombre3: contactData.nombre3 || '',
              telefono3: contactData.telefono3 || ''
            });
          }
        }),
        catchError(error => {
          console.error('Error loading contacts:', error);
          // No mostramos error si es 404 (significa que aún no tiene contactos)
          if (error.status !== 404) {
            this.presentToast('Error al cargar los contactos', 'danger');
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  /**
   * Guarda los contactos del usuario
   */
  saveContacts() {
    if (!this.isFormValid()) {
      this.updateFormErrors();
      return;
    }

    // Verificar si al menos un contacto tiene nombre y teléfono
    const hasContactOne = this.hasContact(1);
    const hasContactTwo = this.hasContact(2);
    const hasContactThree = this.hasContact(3);

    if (!hasContactOne && !hasContactTwo && !hasContactThree) {
      this.formErrors.general = 'Debe ingresar al menos un contacto completo';
      return;
    }

    this.isSaving = true;
    this.formErrors = {};

    this.contactsService.createOrUpdateContacts(this.contactsForm.value)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            this.presentToast('Contactos guardados con éxito', 'success');
          }
        }),
        catchError(error => {
          console.error('Error saving contacts:', error);
          let errorMessage = 'Error al guardar los contactos';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          this.formErrors.general = errorMessage;
          this.presentToast(errorMessage, 'danger');
          return of(null);
        }),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe();
  }

  /**
   * Elimina un contacto específico
   */
  deleteContact(contactNumber: number) {
    switch (contactNumber) {
      case 1:
        this.contactsForm.patchValue({ nombre1: '', telefono1: '' });
        break;
      case 2:
        this.contactsForm.patchValue({ nombre2: '', telefono2: '' });
        break;
      case 3:
        this.contactsForm.patchValue({ nombre3: '', telefono3: '' });
        break;
    }
    
    // Validar que al menos quede un contacto
    if (!this.hasAnyContact()) {
      this.formErrors.general = 'Debe mantener al menos un contacto';
    } else {
      this.formErrors.general = '';
    }
  }

  /**
   * Limpia todos los contactos
   */
  clearAllContacts() {
    this.contactsForm.patchValue({
      nombre1: '',
      telefono1: '',
      nombre2: '',
      telefono2: '',
      nombre3: '',
      telefono3: ''
    });
    this.formErrors = {};
  }

  /**
   * Verifica si un contacto específico tiene datos completos
   */
  hasContact(contactNumber: number): boolean {
    const formValues = this.contactsForm.value;
    switch (contactNumber) {
      case 1:
        return !!(formValues.nombre1 && formValues.telefono1);
      case 2:
        return !!(formValues.nombre2 && formValues.telefono2);
      case 3:
        return !!(formValues.nombre3 && formValues.telefono3);
      default:
        return false;
    }
  }

  /**
   * Verifica si hay al menos un contacto con datos completos
   */
  hasAnyContact(): boolean {
    return this.hasContact(1) || this.hasContact(2) || this.hasContact(3);
  }

  /**
   * Determina si el formulario es válido para enviar
   */
  isFormValid(): boolean {
    // Verificar errores de validación
    if (this.contactsForm.invalid) {
      return false;
    }

    // Verificar que los pares de campos estén completos o vacíos
    const formValues = this.contactsForm.value;
    const isContact1Valid = (!formValues.nombre1 && !formValues.telefono1) || (formValues.nombre1 && formValues.telefono1);
    const isContact2Valid = (!formValues.nombre2 && !formValues.telefono2) || (formValues.nombre2 && formValues.telefono2);
    const isContact3Valid = (!formValues.nombre3 && !formValues.telefono3) || (formValues.nombre3 && formValues.telefono3);

    return isContact1Valid && isContact2Valid && isContact3Valid;
  }

  /**
   * Actualiza los mensajes de error del formulario
   */
  updateFormErrors() {
    this.formErrors = {};
    
    const controls = this.contactsForm.controls;
    
    if (controls['nombre1'].errors && controls['nombre1'].touched) {
      this.formErrors.nombre1 = 'El nombre es requerido';
    }
    
    if (controls['telefono1'].errors && controls['telefono1'].touched) {
      if (controls['telefono1'].errors['required']) {
        this.formErrors.telefono1 = 'El teléfono es requerido';
      } else if (controls['telefono1'].errors['pattern']) {
        this.formErrors.telefono1 = 'Formato de teléfono inválido (7-15 dígitos)';
      }
    }
    
    if (controls['nombre2'].errors && controls['nombre2'].touched) {
      this.formErrors.nombre2 = 'El nombre es requerido';
    }
    
    if (controls['telefono2'].errors && controls['telefono2'].touched) {
      if (controls['telefono2'].errors['required']) {
        this.formErrors.telefono2 = 'El teléfono es requerido';
      } else if (controls['telefono2'].errors['pattern']) {
        this.formErrors.telefono2 = 'Formato de teléfono inválido (7-15 dígitos)';
      }
    }
    
    if (controls['nombre3'].errors && controls['nombre3'].touched) {
      this.formErrors.nombre3 = 'El nombre es requerido';
    }
    
    if (controls['telefono3'].errors && controls['telefono3'].touched) {
      if (controls['telefono3'].errors['required']) {
        this.formErrors.telefono3 = 'El teléfono es requerido';
      } else if (controls['telefono3'].errors['pattern']) {
        this.formErrors.telefono3 = 'Formato de teléfono inválido (7-15 dígitos)';
      }
    }
  }

  /**
   * Muestra un mensaje toast
   */
  async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }
}