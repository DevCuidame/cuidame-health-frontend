import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, NavController, LoadingController } from '@ionic/angular';
import { User } from 'src/app/core/interfaces/auth.interface';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="sidebar">
      <div class="profile-section">
        <div class="avatar-container">
          <img
            [src]="
              user?.photourl
                ? formatImageUrl(user.path)
                : user?.imagebs64 || '/assets/images/default_user.png'
            "
            [alt]="user?.name"
          />
        </div>
        <div class="user-info">
          <h3>
            {{ user?.name?.split(' ')[0] }} {{ user?.lastname?.split(' ')[0] }}
          </h3>
        </div>
      </div>

      <div class="menu-section">
        <!-- Navegación principal -->
        <div
          class="menu-item"
          [class.active]="isActiveRoute(['dashboard', 'home'])"
          (click)="navigateTo('dashboard')"
        >
          <ion-icon name="home-outline"></ion-icon>
          <span>Dashboard</span>
        </div>
        <div
          class="menu-item"
          [class.active]="isActiveRoute(['appointment'])"
          (click)="navigateTo('appointments')"
        >
          <ion-icon name="calendar-outline"></ion-icon>
          <span>Citas</span>
        </div>
        
        <!-- Separador visual -->
        <div class="menu-divider"></div>
        
        <!-- Opciones de perfil y configuración -->
        <div
          class="menu-item"
          [class.active]="isActiveRoute(['profile'])"
          (click)="navigateTo('profile')"
        >
          <ion-icon name="person-outline"></ion-icon>
          <span>Modificar Perfil</span>
        </div>
        <div
          class="menu-item"
          [class.active]="isActiveRoute(['contacts'])"
          (click)="navigateTo('contacts')"
        >
          <ion-icon name="people-outline"></ion-icon>
          <span>Contactos de Emergencia</span>
        </div>
        <div
          class="menu-item"
          [class.active]="isActiveRoute(['password', 'change-password'])"
          (click)="navigateTo('password')"
        >
          <ion-icon name="key-outline"></ion-icon>
          <span>Cambiar Contraseña</span>
        </div>
        <!-- <div
          class="menu-item"
          [class.active]="isActiveRoute(['settings', 'config'])"
          (click)="navigateTo('settings')"
        >
          <ion-icon name="settings-outline"></ion-icon>
          <span>Configuración</span>
        </div>
         -->
        <!-- Separador visual -->
        <div class="menu-divider"></div>
        
        <!-- Opciones de soporte -->
        <div class="menu-item" (click)="openWhatsapp()">
          <ion-icon name="logo-whatsapp"></ion-icon>
          <span>WhatsApp</span>
        </div>
        <div class="menu-item" (click)="openEmail()">
          <ion-icon name="mail-outline"></ion-icon>
          <span>Correo Electrónico</span>
        </div>
        
        <!-- Separador visual -->
        <div class="menu-divider"></div>
        
        <!-- Opciones peligrosas -->
        <div class="menu-item danger" (click)="confirmDeleteAccount()">
          <ion-icon name="trash-outline"></ion-icon>
          <span>Eliminar Cuenta</span>
        </div>
      </div>

      <div class="logout-section">
        <div class="menu-item" (click)="confirmLogout()">
          <ion-icon name="log-out-outline"></ion-icon>
          <span>Cerrar sesión</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard-sidebar.component.scss'],
})
export class DashboardSidebarComponent implements OnInit, OnDestroy {
  @Input() user: User | any = null;
  @Output() menuItemSelected = new EventEmitter<string>();
  @Output() logoutRequested = new EventEmitter<void>();

  private routerSubscription: Subscription = new Subscription();
  public currentUrl: string = '';

  // Mapeo de rutas para cada sección del menú
  private routeMapping = {
    dashboard: ['dashboard', 'home'],
    appointments: ['appointment'],
    profile: ['profile', 'user/profile'],
    contacts: ['contacts', 'user/contacts'],
    password: ['password', 'change-password', 'user/password'],
    settings: ['settings', 'config', 'user/settings']
  };

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    // Obtener la URL actual al inicializar
    this.currentUrl = this.router.url;
    
    // Suscribirse a los cambios de ruta
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.urlAfterRedirects || event.url;
      }
    });
  }

  ngOnDestroy() {
    // Limpiar suscripción para evitar memory leaks
    this.routerSubscription.unsubscribe();
  }

  /**
   * Verifica si alguna de las rutas proporcionadas coincide con la URL actual
   * @param routes Array de strings que pueden estar en la URL actual
   * @returns boolean indicando si la ruta está activa
   */
  isActiveRoute(routes: string[]): boolean {
    if (!this.currentUrl || !routes.length) return false;
    
    // Normalizar la URL (remover parámetros de query y fragmentos)
    const normalizedUrl = this.currentUrl.split('?')[0].split('#')[0].toLowerCase();
    
    // Verificar si alguna de las rutas está contenida en la URL actual
    return routes.some(route => {
      const normalizedRoute = route.toLowerCase();
      return normalizedUrl.includes(normalizedRoute);
    });
  }

  /**
   * Método alternativo más específico para verificar rutas exactas
   * @param routes Array de rutas exactas
   * @returns boolean
   */
  isExactActiveRoute(routes: string[]): boolean {
    if (!this.currentUrl || !routes.length) return false;
    
    const normalizedUrl = this.currentUrl.split('?')[0].split('#')[0].toLowerCase();
    
    return routes.some(route => {
      const normalizedRoute = route.toLowerCase();
      return normalizedUrl === `/${normalizedRoute}` || normalizedUrl === normalizedRoute;
    });
  }

  formatImageUrl(path: string): string {
    if (!path) return '/assets/images/default_user.png';
    return path;
  }

  navigateTo(route: string): void {
    // Emitir el evento para comunicar al componente padre
    this.menuItemSelected.emit(route);

    switch (route) {
      case 'dashboard':
        this.router.navigate(['/home/dashboard']);
        break;
      case 'appointments':
        this.router.navigate(['/appointment/viewer']);
        break;
      case 'contacts':
        this.router.navigate(['/user/contacts']);
        break;
      case 'profile':
        // TODO: Implementar navegación al perfil
        this.router.navigate(['/user/profile']);
        break;
      case 'password':
        // TODO: Implementar navegación a cambiar contraseña
        this.router.navigate(['/user/change-password']);
        break;
      case 'settings':
        // TODO: Implementar navegación a configuración
        this.router.navigate(['/user/settings']);
        break;
      default:
        console.warn(`Ruta no reconocida: ${route}`);
        break;
    }
  }

  // Método para abrir WhatsApp (copiado del tab-bar)
  async openWhatsapp() {
    const loading = await this.showLoading();
    try {
      const whatsappUrl =
        'whatsapp://send?phone=573007306645&text=Hola, me gustaría hablar con un asesor de Cuídame.';
      window.location.href = whatsappUrl;

      setTimeout(() => {
        window.open(
          'https://web.whatsapp.com/send?phone=573007306645&text=Hola, me gustaría hablar con un asesor de Cuídame.',
          '_blank'
        );
      }, 500);
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
    } finally {
      if (loading) {
        loading.dismiss();
      }
    }
  }

  // Método para abrir email (copiado del tab-bar)
  openEmail() {
    const email = 'cuidame@esmart-tek.com';
    const subject = 'Consulta desde la App';
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    window.location.href = emailUrl;
  }

  // Método para confirmar eliminación de cuenta
  async confirmDeleteAccount() {
    this.navCtrl.navigateForward('/user/delete-account')

  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancel-button'
        },
        {
          text: 'Confirmar',
          cssClass: 'confirm-button',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  // Método de logout mejorado (copiado del tab-bar)
  async logout() {
    const loading = await this.loadingCtrl.create({
      message: 'Cerrando sesión...'
    });
    await loading.present();

    this.authService.logout()
      .pipe(
        finalize(() => {
          loading.dismiss();
        })
      )
      .subscribe(
        () => {
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          }, 100);
        },
        (error) => {
          console.error('Error al cerrar sesión:', error);
          
          try {
            // Limpiar localStorage como fallback
            localStorage.removeItem('token');
            localStorage.removeItem('refresh-token');
            localStorage.removeItem('user');
            localStorage.removeItem('beneficiaries');
            localStorage.removeItem('activeBeneficiary');
            
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          } catch (e) {
            console.error('Error limpiando almacenamiento:', e);
            window.location.href = '/auth/login';
          }
        }
      );
  }

  // Método para mostrar loading (copiado del tab-bar)
  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Espera un momento, por favor...',
      cssClass: 'custom-loading',
    });

    loading.present();
    return loading;
  }
}