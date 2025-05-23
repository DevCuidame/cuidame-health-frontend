import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HeaderDashComponent } from '../header-dash/header-dash.component';
import { SidebarDashComponent } from '../sidebar-dash/sidebar-dash.component';
import { filter, Subscription } from 'rxjs';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { User } from 'src/app/core/interfaces/auth.interface';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-containter-dash',
  imports: [CommonModule, RouterModule, HeaderDashComponent, SidebarDashComponent],
  templateUrl: './containter-dash.component.html',
  styleUrls: ['./containter-dash.component.scss'],
})
export class ContainterDashComponent implements OnInit, OnDestroy {
  public isVisible: boolean = false;
  public user: User | any = null;
  public profileImage: string = '';
  public environment = environment.url;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router, 
    private userService: UserService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Cargar datos del usuario
    this.loadUserData();

    // Configurar navegación
    this.setupRouterNavigation();
  }

  ngOnDestroy() {
    // Limpiar suscripciones para evitar memory leaks
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  /**
   * Carga los datos del usuario desde el UserService
   */
  private loadUserData() {
    const userSub = this.userService.user$.subscribe((userData) => {
      if (Array.isArray(userData) && userData.length > 0) {
        this.user = userData[0];
      } else {
        this.user = userData;
      }

      // Normalizar ubicación si es necesario
      if (
        this.user?.location &&
        Array.isArray(this.user.location) &&
        this.user.location.length > 0
      ) {
        this.user.location = this.user.location[0];
      }

      // Actualizar imagen de perfil
      this.updateProfileImage();
      
      // Detectar cambios para actualizar la vista
      this.cdRef.detectChanges();
    });

    this.subscriptions.push(userSub);
  }

  /**
   * Actualiza la URL de la imagen de perfil
   */
  private updateProfileImage() {
    if (this.user?.path) {
      this.profileImage = `${environment.url}${this.user.path.replace(/\\/g, '/')}`;
    } else if (this.user?.imagebs64) {
      this.profileImage = this.user.imagebs64;
    } else {
      this.profileImage = 'assets/images/default_profile.png';
    }
  }

  /**
   * Configura la navegación del router
   */
  private setupRouterNavigation() {
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.url;
        if (url.includes('/daily')) {
          this.isVisible = true;
        } else if (url.includes('/pending')) {
          this.isVisible = false;
        } else if (url.includes('/assigment')) {
          this.isVisible = true;
        }
      });

    this.subscriptions.push(routerSub);
  }

  /**
   * Formatea la URL de imagen (método auxiliar)
   */
  formatImageUrl(url: string): string {
    if (!url) return '/assets/images/default_user.png';

    let formattedUrl = url.replace(/\\/g, '/');

    const apiUrl = this.environment.endsWith('/')
      ? this.environment.slice(0, -1)
      : this.environment;

    if (formattedUrl.startsWith('/')) {
      formattedUrl = formattedUrl.substring(1);
    }

    return `${apiUrl}/${formattedUrl}`;
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  getUserFullName(): string {
    if (!this.user) return '';
    return `${this.user.nombre || ''} ${this.user.apellido || ''}`.trim();
  }

}