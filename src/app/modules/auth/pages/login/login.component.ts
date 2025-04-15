// src/app/modules/auth/pages/login/login.page.ts
import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LoadingController,
  AlertController,
  IonicModule,
  NavController,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CustomButtonComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  public loginForm: FormGroup;
  public passwordVisible: boolean = false;
  public buttonBackground: string = 'assets/background/button_primary_bg.png';

  @Output() forgotPassword = new EventEmitter<void>();

  onForgotPassword() {
    this.forgotPassword.emit(); 
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    public navCtrl: NavController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  goToRegister() {
    this.navCtrl.navigateForward('/auth/register');
  }

  async login() {
  if (this.loginForm.valid) {
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    this.authService.login(this.loginForm.value).subscribe(
      async (response) => {
        console.log("🚀 ~ LoginComponent ~ response:", response)
        await loading.dismiss();
        await this.navCtrl.navigateRoot(['/home/dashboard']);
        // window.location.reload();
      },
      async (error) => {
        await loading.dismiss();
        
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        if (errorMessage.includes('verifica tu correo') || 
            errorMessage.toLowerCase().includes('email verification') ||
            (error.status === 401 && errorMessage.includes('correo'))) {
          this.showVerificationAlert(this.loginForm.value.email);
        } else {
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: errorMessage,
            buttons: ['OK'],
          });
          await alert.present();
        }
      }
    );
  }
}

/**
 * Muestra un diálogo específico para errores de verificación de correo
 */
async showVerificationAlert(email: string) {
  const alert = await this.alertCtrl.create({
    header: 'Verificación Pendiente',
    message: `Por favor verifica tu correo electrónico para continuar. Hemos enviado un enlace de verificación a ${email}`,
    cssClass: 'verification-alert-modal',
    buttons: [
      {
        text: 'Reenviar Correo',
        handler: () => {
          this.resendVerificationEmail(email);
        }
      },
      {
        text: 'OK',
        role: 'cancel'
      }
    ]
  });
  
  await alert.present();
}

/**
 * Reenvía el correo de verificación
 */
resendVerificationEmail(email: string) {
  // Muestra un loading
  this.loadingCtrl.create({
    message: 'Reenviando correo de verificación...'
  }).then(loading => {
    loading.present();
    
    // Llama al servicio para reenviar el correo
    // Debes implementar este método en tu AuthService
    this.authService.resendVerificationEmail(email).subscribe(
      async () => {
        loading.dismiss();
        const successAlert = await this.alertCtrl.create({
          header: 'Correo Enviado',
          message: 'Hemos reenviado el correo de verificación. Por favor revisa tu bandeja de entrada.',
          buttons: ['OK']
        });
        await successAlert.present();
      },
      async (error) => {
        loading.dismiss();
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: 'No pudimos reenviar el correo de verificación. Por favor intenta más tarde.',
          buttons: ['OK']
        });
        await errorAlert.present();
      }
    );
  });
}
}
