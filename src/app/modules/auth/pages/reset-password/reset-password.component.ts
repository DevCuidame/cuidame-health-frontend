import { Component, ViewEncapsulation } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LoadingController,
  IonicModule,
  ToastController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ResetPasswordService } from 'src/app/core/services/reset-password.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CustomButtonComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ResetPasswordComponent {
  public buttonBackground: string = 'assets/background/primary_button_bg.svg';
  resetPasswordForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private resetPasswordService: ResetPasswordService,
    private toastCtrl: ToastController
  ) {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async resetPassword() {
    if (this.resetPasswordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const email = this.resetPasswordForm.get('email')?.value;
      
      const loading = await this.loadingCtrl.create({
        message: 'Procesando solicitud...',
      });
      await loading.present();

      this.resetPasswordService.requestPasswordReset(email)
        .pipe(
          finalize(() => {
            loading.dismiss();
            this.isSubmitting = false;
          }),
          catchError(error => {
            console.error('Error al solicitar restablecimiento de contraseña:', error);
            this.showToast('Ha ocurrido un error. Por favor, intente de nuevo más tarde.', 'danger');
            return of(null);
          })
        )
        .subscribe(response => {
          if (response) {
            this.resetPasswordForm.reset();
            this.showToast(
              'Se ha enviado un correo con instrucciones para restablecer tu contraseña.',
              'success'
            );
          }
        });
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
    });
    await toast.present();
  }
}