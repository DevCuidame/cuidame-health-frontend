import { Injectable, Injector } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private authService: AuthService | null = null;

  constructor(
    private router: Router, 
    private injector: Injector
  ) {}

  // Obtener AuthService de forma perezosa
  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

  canActivate(): Observable<boolean | UrlTree> {
    return this.getAuthService().isAuthenticated$().pipe(
      take(1),
      map((isAuthenticated) => {
        if (!isAuthenticated) {
          return this.router.createUrlTree(['/auth/login']);
        }
        return true;
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/auth/login']));
      })
    );
  }
}

@Injectable({ providedIn: 'root' })
export class AutoRedirectGuard implements CanActivate {
  private authService: AuthService | null = null;

  constructor(
    private router: Router,
    private injector: Injector
  ) {}

  // Obtener AuthService de forma perezosa
  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const redirectTo = route.data['redirectTo'] || '/home';  // Leer la ruta de redirección desde los datos de la ruta

    return this.getAuthService().isAuthenticated$().pipe(
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          // Si está autenticado, redirige a la ruta específica
          return this.router.createUrlTree([redirectTo]);
        }
        return true;  // Si no está autenticado, permite el acceso a login
      }),
      catchError(() => {
        return of(true); // Si hay error, permitir acceso por defecto
      })
    );
  }
}