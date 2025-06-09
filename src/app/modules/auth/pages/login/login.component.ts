import { Component, EventEmitter, Output, NgZone } from '@angular/core';
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
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

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
    public navCtrl: NavController,
    private router: Router,
    private ngZone: NgZone
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

      // Usar finalize para asegurar que se cierre el loading independientemente del resultado
      this.authService.login(this.loginForm.value)
        .pipe(finalize(() => loading.dismiss()))
        .subscribe(
          async (response) => {
            // Verificar la estructura de la respuesta para manejar ambos formatos posibles
            const success = response.success || (response.data && response.data.access_token);
            
            if (success) {
              // Verificar si el usuario es Admin para redirigirlo a schedule-panel
              this.authService.getUserData().subscribe(user => {
                const targetRoute = user && user.role === 'Admin' ? '/schedule-panel' : '/home/dashboard';
                
                // Usar múltiples estrategias de navegación
                this.ngZone.run(() => {
                  // 1. Usar el Router directamente
                  this.router.navigate([targetRoute], { replaceUrl: true })
                    .then(() => {
                    })
                    .catch(error => {
                      
                      // 2. Si falla, intentar con NavController
                      this.navCtrl.navigateRoot([targetRoute])
                        .then(() => {
                        })
                        .catch(error => {
                          
                          // 3. Como último recurso, usar la API del navegador
                          setTimeout(() => {
                            window.location.href = targetRoute;
                          }, 300);
                        });
                    });
                });
              });
              
            } else {
              this.showError('Inicio de sesión fallido. Verifica tus credenciales.');
            }
          },
          async (error) => {
            let errorMessage = 'Inicio de sesión fallido. Verifica tus credenciales.';

            if (
              errorMessage.includes('verifica tu correo') ||
              errorMessage.toLowerCase().includes('email verification') ||
              (error.status === 401 && errorMessage.includes('correo'))
            ) {
              this.showVerificationAlert(this.loginForm.value.email);
            } else {
              this.showError(errorMessage);
            }
          }
        );
    }
  }

  /**
   * Muestra un mensaje de error genérico
   */
  async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
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
          },
        },
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  /**
   * Reenvía el correo de verificación
   */
  resendVerificationEmail(email: string) {
    // Muestra un loading
    this.loadingCtrl
      .create({
        message: 'Reenviando correo de verificación...',
      })
      .then((loading) => {
        loading.present();

        // Llama al servicio para reenviar el correo
        this.authService.resendVerificationEmail(email)
          .pipe(finalize(() => loading.dismiss()))
          .subscribe(
            async () => {
              const successAlert = await this.alertCtrl.create({
                header: 'Correo Enviado',
                message:
                  'Hemos reenviado el correo de verificación. Por favor revisa tu bandeja de entrada.',
                buttons: ['OK'],
              });
              await successAlert.present();
            },
            async (error) => {
              const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message:
                  'No pudimos reenviar el correo de verificación. Por favor intenta más tarde.',
                buttons: ['OK'],
              });
              await errorAlert.present();
            }
          );
      });
  }


  goToResetPassword(){
    this.navCtrl.navigateForward('/auth/reset-password');
  }

  loginWithGoogle() {
    
  }

  loginWithFacebook() {
    
  }

}