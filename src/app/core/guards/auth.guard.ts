import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {

    return this.authService.isAuthenticated$().pipe(
      take(1),
      map((isAuthenticated) => {
        if (!isAuthenticated) {
          return this.router.createUrlTree(['/auth/login']);
        }
        return true;
      })
    );
  }
}

@Injectable({ providedIn: 'root' })
export class AutoRedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const redirectTo = route.data['redirectTo'] || '/home';  // Leer la ruta de redirección desde los datos de la ruta

    return this.authService.isAuthenticated$().pipe(
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          // Si está autenticado, redirige a la ruta específica
          return this.router.createUrlTree([redirectTo]);
        }
        return true;  // Si no está autenticado, permite el acceso a login
      })
    );
  }
}
