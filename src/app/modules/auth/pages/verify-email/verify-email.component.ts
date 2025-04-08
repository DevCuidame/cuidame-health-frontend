import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  verificationStatus: 'loading' | 'success' | 'error' = 'loading';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.verifyEmail();
  }

  async verifyEmail() {
    const loading = await this.loadingCtrl.create({
      message: 'Verificando tu correo electrónico...',
      spinner: 'circular'
    });
    
    await loading.present();

    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.verificationStatus = 'error';
      this.errorMessage = 'Token de verificación no encontrado en la URL.';
      loading.dismiss();
      return;
    }

    this.http.get(`${environment.url}api/v1/email/verify/${token}`)
      .pipe(
        catchError(error => {
          this.verificationStatus = 'error';
          this.errorMessage = error.error?.error || 'No pudimos verificar tu correo electrónico. Por favor intenta nuevamente.';
          return throwError(() => error);
        }),
        finalize(() => loading.dismiss())
      )
      .subscribe(() => {
        this.verificationStatus = 'success';
      });
  }

  async showError() {
    const alert = await this.alertCtrl.create({
      header: 'Error de verificación',
      message: this.errorMessage,
      buttons: ['OK']
    });
    await alert.present();
  }

  goToLogin() {
    this.router.navigate(['/desktop']);
  }
}