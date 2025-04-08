import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

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
    private alertController: AlertController
  ) {
    // Opciones del menú desplegable
    this.menuItems = [
      { 
        icon: 'person-outline', 
        label: 'Eliminar Cuenta', 
        action: () => true
      },
      { 
        icon: 'whatsapp-outline', 
        label: 'Whatsapp', 
        action: () => true
      },
      { 
        icon: 'whatsapp-outline', 
        label: 'Correo Electrónico', 
        action: () => true
      },
      { 
        icon: 'whatsapp-outline', 
        label: 'Modificar Datos del Propietario', 
        action: () => true
      },
      { 
        icon: 'person-outline', 
        label: 'Contactos de Emergencia', 
        action: () => true
      },
      { 
        icon: 'key-outline', 
        label: 'Cambiar Contraseña', 
        action: () => true
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

  // Oculta el menú si se hace clic fuera de él
  hideMenu() {
    setTimeout(() => {
      this.showMenu = false;
    }, 100);
  }

  // navigateToProfile() {
  //   this.router.navigate(['/profile']);
  //   this.showMenu = false;
  // }

  // navigateToSettings() {
  //   this.router.navigate(['/settings']);
  //   this.showMenu = false;
  // }

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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}