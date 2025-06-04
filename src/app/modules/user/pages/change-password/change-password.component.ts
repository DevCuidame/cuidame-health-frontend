import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { DashboardSidebarComponent } from 'src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';
import { User } from 'src/app/core/interfaces/auth.interface';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    TabBarComponent,
    DashboardSidebarComponent,
    CustomButtonComponent
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  currentUser: User | null = null;
  isMobile: boolean = false;
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isSubmitting: boolean = false;

  // Tab bar configuration for mobile
  tabButtons = [
    { icon: 'arrow-back-outline', route: '/home/dashboard', visible: true },
    { icon: 'ellipsis-horizontal', route: '', visible: true },
    { icon: 'exit-outline', route: '/', visible: true }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.checkScreenSize();
    this.loadCurrentUser();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  private loadCurrentUser() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(field: string) {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  async onSubmit() {
    if (this.changePasswordForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Cambiando contraseña...'
    });
    await loading.present();

    const formData = this.changePasswordForm.value;
    
    this.changePassword(formData.currentPassword, formData.newPassword)
      .pipe(
        finalize(() => {
          loading.dismiss();
          this.isSubmitting = false;
        }),
        catchError(error => {
          console.error('Error al cambiar contraseña:', error);
          this.showAlert('Error', 'No se pudo cambiar la contraseña. Verifica que la contraseña actual sea correcta.');
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.showAlert('Éxito', 'Contraseña cambiada exitosamente.', () => {
            this.router.navigate(['/home/dashboard']);
          });
        }
      });
  }

  private changePassword(currentPassword: string, newPassword: string) {
    const url = `${environment.url}api/auth/change-password`;
    const body = {
      currentPassword,
      newPassword
    };
    
    return this.http.put(url, body);
  }

  private markFormGroupTouched() {
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      this.changePasswordForm.get(key)?.markAsTouched();
    });
  }

  private async showAlert(header: string, message: string, callback?: () => void) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [{
        text: 'OK',
        handler: callback
      }]
    });
    await alert.present();
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.changePasswordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.changePasswordForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    
    if (fieldName === 'confirmPassword' && this.changePasswordForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    
    return '';
  }

  goBack() {
    this.router.navigate(['/home/dashboard']);
  }
}