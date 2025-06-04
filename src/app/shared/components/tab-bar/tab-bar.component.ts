import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss']
})
export class TabBarComponent {
  @Input() isVisible: boolean = true; // Controla si la barra se muestra
  @Input() buttons: { icon: string; route: string; visible: boolean }[] = [];
  @Input() background: string = '';
  
  showMenu: boolean = false;
  menuItems: { icon: string; label: string; action: () => void }[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,

  ) {
    // Opciones del menú desplegable
    this.menuItems = [
      { 
        icon: 'trash-outline', 
        label: 'Eliminar Cuenta', 
        action: () => this.navigate('/user/delete-account')
      },
      { 
        icon: 'logo-whatsapp', 
        label: 'Whatsapp', 
        action: () => this.openWhatsapp() 
      },
      { 
        icon: 'mail-outline', 
        label: 'Correo Electrónico', 
        action: () => this.openEmail()
      },
      { 
        icon: 'person-outline', 
        label: 'Modificar Perfil', 
        action: () => this.navigate('/home/profile')
      },
      { 
        icon: 'people-outline', 
        label: 'Contactos de Emergencia', 
        action: () => this.navigate('/user/contacts')
      },
      { 
        icon: 'key-outline', 
        label: 'Cambiar Contraseña', 
        action: () => this.navigate('/user/change-password')
      },
      { 
        icon: 'log-out-outline', 
        label: 'Cerrar sesión', 
        action: () => this.confirmLogout() 
      }
    ];
  }

  navigate(route: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  hideMenu() {
    setTimeout(() => {
      this.showMenu = false;
    }, 100);
  }

  openWhatsapp = async () => {
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
  };

  openEmail = () => {
    const email = 'cuidame@esmart-tek.com';
    const subject = 'Consulta desde la App';
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    // Uso directo de window.location
    window.location.href = emailUrl;
  };

  async confirmLogout() {
    this.showMenu = false;
    
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

  async logout() {
    // Mostrar un indicador de carga 
    const loading = await this.loadingCtrl.create({
      message: 'Cerrando sesión...'
    });
    await loading.present();

    // Suscribirse al Observable que devuelve el método logout
    this.authService.logout()
      .pipe(
        finalize(() => {
          // Asegurarse de que el loading se cierre independientemente del resultado
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
            // Limpiar localStorage como fallback por si el storage service falló
            localStorage.removeItem('token');
            localStorage.removeItem('refresh-token');
            localStorage.removeItem('user');
            localStorage.removeItem('beneficiaries');
            localStorage.removeItem('activeBeneficiary');
            
            // Todavía redirigir al login
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          } catch (e) {
            console.error('Error limpiando almacenamiento:', e);
            // En caso de error total, recargar la página
            window.location.href = '/auth/login';
          }
        }
      );
  }

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Espera un momento, por favor...',
      cssClass: 'custom-loading',
    });

    loading.present();
    return loading;
  }

}