import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Servicio que fuerza la recarga de la página en determinadas rutas para evitar problemas de navegación
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationFixService {
  private lastUrl: string = '';
  private forceReloadRoutes: string[] = [
    '/home/dashboard',
    '/auth/login'
  ];

  constructor(private router: Router) {
    // Escuchar eventos de navegación
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Verificar si la navegación es a una ruta que necesita recarga forzada
        const currentUrl = event.urlAfterRedirects;
        
        if (this.shouldForceReload(currentUrl, this.lastUrl)) {
          console.log(`Forzando recarga de página en ruta: ${currentUrl}`);
          setTimeout(() => {
            window.location.href = currentUrl;
          }, 100);
        }
        
        this.lastUrl = currentUrl;
      });
  }

  /**
   * Determina si debemos forzar la recarga de la página
   */
  private shouldForceReload(currentUrl: string, lastUrl: string): boolean {
    // Si estamos navegando desde auth/login a home/dashboard o viceversa
    const isLoginToHome = lastUrl.includes('/auth/login') && currentUrl.includes('/home/dashboard');
    const isHomeToLogin = lastUrl.includes('/home/dashboard') && currentUrl.includes('/auth/login');
    
    return isLoginToHome || isHomeToLogin;
  }

  /**
   * Navega a una ruta y opcionalmente fuerza la recarga de la página
   */
  navigateWithReload(route: string, forceReload: boolean = false): void {
    if (forceReload) {
      window.location.href = route;
    } else {
      this.router.navigateByUrl(route);
    }
  }
}