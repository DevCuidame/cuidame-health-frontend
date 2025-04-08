import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../modules/auth/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  // Lista de rutas de autenticación que no deberían desencadenar un refresh token
  private authRoutes = [
    'api/v1/auth/login',
    'api/v1/auth/register',
    'api/v1/auth/refresh-token',
    'api/v1/email/resend'
  ];

  constructor(
    private router: Router,
    private toastController: ToastController,
    private authService: AuthService
  ) {}

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(this.addAuthToken(req)).pipe(
      catchError((error: HttpErrorResponse) => {
        // Verificar si es una ruta de autenticación
        const isAuthRoute = this.authRoutes.some(route => req.url.includes(route));
        
        if (error.status === 401 && !isAuthRoute) {
          // Solo intentamos refrescar el token si no es una ruta de autenticación
          return this.handle401Error(req, next);
        }
        
        // Para rutas de autenticación o errores diferentes, simplemente pasamos el error
        return throwError(() => error);
      })
    );
  }

  private addAuthToken(request: HttpRequest<any>) {
    const token = localStorage.getItem('token');
    return token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((newTokens: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newTokens.accessToken);
          return next.handle(this.addAuthToken(request));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => next.handle(this.addAuthToken(request)))
      );
    }
  }
}