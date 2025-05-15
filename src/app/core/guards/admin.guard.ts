import { Injectable, Injector } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, take, catchError, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private authService: AuthService | null = null;

  constructor(
    private router: Router, 
    private injector: Injector
  ) {}

  // Obtener AuthService de forma perezosa para evitar dependencias circulares
  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

  canActivate(): Observable<boolean | UrlTree> {
    return this.getAuthService().isAuthenticated$().pipe(
      take(1),
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          // Si no está autenticado, redirigir al login
          return of(this.router.createUrlTree(['/auth/login']));
        }
        
        // Verificar si el usuario es administrador usando observable
        return this.getAuthService().getUserData().pipe(
          map(user => {
            if (user && user.isAdmin === true) {
              // Si es administrador, permitir acceso
              return true;
            } else {
              // Si no es administrador, redirigir al dashboard
              return this.router.createUrlTree(['/home/dashboard']);
            }
          })
        );
      }),
      catchError(() => {
        // En caso de error, redirigir al login
        return of(this.router.createUrlTree(['/auth/login']));
      })
    );
  }
}