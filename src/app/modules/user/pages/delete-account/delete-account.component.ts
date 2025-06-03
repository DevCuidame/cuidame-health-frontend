import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-content>
      <div class="delete-account-container">
        <!-- Header Section -->
        <div class="header-section">
          <ion-icon name="warning" class="warning-icon"></ion-icon>
          <h2>Eliminar Cuenta</h2>
          <p class="warning-text">
            Esta acción es <strong>permanente</strong> y no se puede deshacer.
            Todos tus datos serán eliminados del sistema.
          </p>
        </div>

        <!-- Information Card -->
        <div class="info-card">
          <ion-icon
            name="information-circle-outline"
            class="info-icon"
          ></ion-icon>
          <div class="info-content">
            <h3>¿Qué sucederá al eliminar tu cuenta?</h3>
            <ul>
              <li>Se eliminarán todos tus datos personales</li>
              <li>Se borrarán tus contactos de emergencia</li>
              <li>Perderás acceso a todos los servicios</li>
              <li>No podrás recuperar la información</li>
              <li>Se cancelarán las suscripciones activas</li>
            </ul>
          </div>
        </div>

        <!-- Confirmation Form -->
        <form
          [formGroup]="deleteForm"
          (ngSubmit)="confirmDeletion()"
          class="deletion-form"
        >
          <div class="form-section">
            <h3>Confirma tu identidad</h3>
            <p>Para continuar, ingresa tu contraseña actual:</p>

            <div class="form-group">
              <label for="password">
                <ion-icon name="lock-closed-outline"></ion-icon>
                Contraseña actual
              </label>
              <input
                type="password"
                id="password"
                formControlName="password"
                placeholder="Ingresa tu contraseña"
                [class.error]="passwordError"
              />
              <small *ngIf="passwordError" class="error-message">
                <ion-icon name="alert-circle-outline"></ion-icon>
                {{ passwordError }}
              </small>
            </div>

            <div class="form-group">
              <label for="confirmation">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                Confirmación
              </label>
              <input
                type="text"
                id="confirmation"
                formControlName="confirmation"
                placeholder='Escribe "ELIMINAR" para confirmar'
                [class.error]="confirmationError"
              />
              <small *ngIf="confirmationError" class="error-message">
                <ion-icon name="alert-circle-outline"></ion-icon>
                {{ confirmationError }}
              </small>
            </div>
          </div>

          <!-- Reason Selection -->
          <div class="reason-section">
            <h3>¿Por qué eliminas tu cuenta? (Opcional)</h3>
            <ion-radio-group formControlName="reason">
              <ion-item lines="none" class="reason-item">
                <ion-radio slot="start" value="no_longer_needed"></ion-radio>
                <ion-label>Ya no necesito el servicio</ion-label>
              </ion-item>
              <ion-item lines="none" class="reason-item">
                <ion-radio slot="start" value="privacy_concerns"></ion-radio>
                <ion-label>Preocupaciones de privacidad</ion-label>
              </ion-item>
              <ion-item lines="none" class="reason-item">
                <ion-radio slot="start" value="technical_issues"></ion-radio>
                <ion-label>Problemas técnicos</ion-label>
              </ion-item>
              <ion-item lines="none" class="reason-item">
                <ion-radio slot="start" value="customer_service"></ion-radio>
                <ion-label>Servicio al cliente</ion-label>
              </ion-item>
              <ion-item lines="none" class="reason-item">
                <ion-radio slot="start" value="other"></ion-radio>
                <ion-label>Otro motivo</ion-label>
              </ion-item>
            </ion-radio-group>

            <div
              *ngIf="deleteForm.get('reason')?.value === 'other'"
              class="other-reason"
            >
              <textarea
                formControlName="otherReason"
                placeholder="Por favor, cuéntanos más detalles..."
                rows="3"
              >
              </textarea>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="buttons-container">
            <button
              type="button"
              class="cancel-button"
              (click)="goBack()"
              [disabled]="isDeleting"
            >
              <ion-icon name="arrow-back-outline"></ion-icon>
              Cancelar
            </button>

            <button
              type="submit"
              class="delete-button"
              [disabled]="!deleteForm.valid || isDeleting"
            >
              <ion-icon name="trash-outline" *ngIf="!isDeleting"></ion-icon>
              <ion-spinner
                *ngIf="isDeleting"
                name="circular"
                class="spinner-button"
              ></ion-spinner>
              <span *ngIf="!isDeleting">Eliminar Cuenta</span>
              <span *ngIf="isDeleting">Eliminando...</span>
            </button>
          </div>
        </form>

        <!-- Contact Support -->
        <div class="support-section">
          <h3>¿Tienes dudas?</h3>
          <p>
            Si tienes problemas con la app, contáctanos antes de eliminar tu
            cuenta.
          </p>
          <div class="support-buttons">
            <button
              type="button"
              class="support-button"
              (click)="contactWhatsapp()"
            >
              <ion-icon name="logo-whatsapp"></ion-icon>
              WhatsApp
            </button>
            <button
              type="button"
              class="support-button"
              (click)="contactEmail()"
            >
              <ion-icon name="mail-outline"></ion-icon>
              Email
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./delete-account.component.scss'],
})
export class DeleteAccountComponent implements OnInit {
  deleteForm: FormGroup;
  isDeleting: boolean = false;
  passwordError: string = '';
  confirmationError: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.deleteForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', [Validators.required, this.confirmationValidator]],
      reason: [''],
      otherReason: [''],
    });
  }

  ngOnInit() {
    this.setupFormValidation();
  }

  private setupFormValidation() {
    // Validación en tiempo real
    this.deleteForm.get('password')?.valueChanges.subscribe(() => {
      this.passwordError = '';
    });

    this.deleteForm.get('confirmation')?.valueChanges.subscribe(() => {
      this.confirmationError = '';
    });

    // Hacer obligatorio otherReason cuando reason es 'other'
    this.deleteForm.get('reason')?.valueChanges.subscribe((value) => {
      const otherReasonControl = this.deleteForm.get('otherReason');
      if (value === 'other') {
        otherReasonControl?.setValidators([Validators.required]);
      } else {
        otherReasonControl?.clearValidators();
      }
      otherReasonControl?.updateValueAndValidity();
    });
  }

  private confirmationValidator(control: any) {
    if (control.value !== 'ELIMINAR') {
      return { invalidConfirmation: true };
    }
    return null;
  }

  async confirmDeletion() {
    if (!this.deleteForm.valid) {
      this.updateFormErrors();
      return;
    }

    const alert = await this.alertController.create({
      header: '⚠️ Confirmación Final',
      message:
        '¿Estás absolutamente seguro?\n\nEsta acción eliminará permanentemente tu cuenta y todos los datos asociados.\n\nNo hay forma de recuperar la información una vez eliminada.',
      cssClass: 'delete-confirmation-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancel-button',
        },
        {
          text: 'Eliminar Definitivamente',
          cssClass: 'delete-button',
          handler: () => {
            this.executeAccountDeletion();
          },
        },
      ],
    });

    await alert.present();

    await alert.present();
  }

  private async executeAccountDeletion() {
    this.isDeleting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Eliminando cuenta...',
      spinner: 'circular',
    });
    await loading.present();

    const formData = {
      password: this.deleteForm.get('password')?.value,
      reason: this.deleteForm.get('reason')?.value,
      otherReason: this.deleteForm.get('otherReason')?.value,
      confirmation: this.deleteForm.get('confirmation')?.value,
    };

    // Simular llamada al servicio (debes implementar el método real)
    this.deleteAccount(formData)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          loading.dismiss();
        })
      )
      .subscribe(
        async (response: any) => {
          // Éxito - mostrar mensaje y redirigir
          await this.presentToast(
            'Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir.',
            'success'
          );

          // Limpiar storage y redirigir
          this.clearAllData();
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          }, 2000);
        },
        async (error: any) => {
          console.error('Error deleting account:', error);

          if (
            error.status === 401 ||
            error.error?.message?.includes('contraseña')
          ) {
            this.passwordError = 'Contraseña incorrecta';
          } else {
            await this.presentToast(
              'Error al eliminar la cuenta. Por favor, inténtalo más tarde.',
              'danger'
            );
          }
        }
      );
  }

  private deleteAccount(data: any) {
    return this.authService.deleteAccount
      ? this.authService.deleteAccount(data)
      : of({ success: true }).pipe(
          finalize(() => new Promise((resolve) => setTimeout(resolve, 2000)))
        );
  }

  private clearAllData() {
    try {
      this.authService.logout();
      // Agregar cualquier otro dato que necesites limpiar
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  private updateFormErrors() {
    const controls = this.deleteForm.controls;

    if (controls['password'].errors) {
      if (controls['password'].errors['required']) {
        this.passwordError = 'La contraseña es requerida';
      } else if (controls['password'].errors['minlength']) {
        this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    if (controls['confirmation'].errors) {
      if (controls['confirmation'].errors['required']) {
        this.confirmationError = 'Debes escribir "ELIMINAR" para confirmar';
      } else if (controls['confirmation'].errors['invalidConfirmation']) {
        this.confirmationError = 'Debes escribir exactamente "ELIMINAR"';
      }
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async contactWhatsapp() {
    const whatsappUrl =
      'whatsapp://send?phone=573007306645&text=Hola, tengo dudas sobre eliminar mi cuenta en Cuídame.';
    window.location.href = whatsappUrl;

    setTimeout(() => {
      window.open(
        'https://web.whatsapp.com/send?phone=573007306645&text=Hola, tengo dudas sobre eliminar mi cuenta en Cuídame.',
        '_blank'
      );
    }, 500);
  }

  contactEmail() {
    const email = 'cuidame@esmart-tek.com';
    const subject = 'Consulta sobre eliminación de cuenta';
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    window.location.href = emailUrl;
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      position: 'top',
      color,
      buttons: [
        {
          icon: 'close',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }
}
