import { Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, switchMap, filter, take, finalize, mergeMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../modules/auth/services/auth.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  private authService: AuthService | null = null;
  private storageService: StorageService | null = null;

  // Lista de rutas de autenticación que no deberían desencadenar un refresh token
  private authRoutes = [
    'api/auth/login',
    'api/auth/register',
    'api/auth/refresh-token',
    'api/email/resend'
  ];

  constructor(
    private router: Router,
    private toastController: ToastController,
    private injector: Injector
  ) {}

  // Obtenemos la instancia de AuthService de forma perezosa para evitar la dependencia circular
  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

  // Obtenemos la instancia de StorageService de forma perezosa
  private getStorageService(): StorageService {
    if (!this.storageService) {
      this.storageService = this.injector.get(StorageService);
    }
    return this.storageService;
  }

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
    // Utilizamos la nueva aproximación usando StorageService en lugar de localStorage
    return this.addTokenToRequest(req).pipe(
      switchMap(requestWithToken => 
        next.handle(requestWithToken).pipe(
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
        )
      )
    );
  }

  private addTokenToRequest(request: HttpRequest<any>): Observable<HttpRequest<any>> {
    return this.getStorageService().getItem('token').pipe(
      map(token => {
        if (token) {
          return request.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
        }
        return request;
      })
    );
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Obtenemos authService de forma perezosa
      const authService = this.getAuthService();

      return authService.refreshToken().pipe(
        switchMap((newTokens: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newTokens.accessToken);
          return this.addTokenToRequest(request).pipe(
            switchMap(requestWithToken => next.handle(requestWithToken))
          );
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // Usando el método observable de logout
          return from(authService.logout()).pipe(
            switchMap(() => throwError(() => err))
          );
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap(() => this.addTokenToRequest(request)),
        switchMap(requestWithToken => next.handle(requestWithToken))
      );
    }
  }
}