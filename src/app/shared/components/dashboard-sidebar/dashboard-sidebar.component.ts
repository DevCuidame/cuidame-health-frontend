import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, NavController } from '@ionic/angular';
import { User } from 'src/app/core/interfaces/auth.interface';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

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
        <div
          class="menu-item"
          [class.active]="activeMenuItem === 'dashboard'"
          (click)="navigateTo('dashboard')"
        >
          <ion-icon name="home-outline"></ion-icon>
          <span>Dashboard</span>
        </div>
        <div
          class="menu-item"
          [class.active]="activeMenuItem === 'appointments'"
          (click)="navigateTo('appointments')"
        >
          <ion-icon name="calendar-outline"></ion-icon>
          <span>Citas</span>
        </div>
        <div
          class="menu-item"
          [class.active]="activeMenuItem === 'profile'"
          (click)="navigateTo('profile')"
        >
          <ion-icon name="person-outline"></ion-icon>
          <span>Perfil</span>
        </div>
        <div
          class="menu-item"
          [class.active]="activeMenuItem === 'settings'"
          (click)="navigateTo('settings')"
        >
          <ion-icon name="settings-outline"></ion-icon>
          <span>Configuración</span>
        </div>
      </div>

      <div class="logout-section">
        <div class="menu-item" (click)="logout()">
          <ion-icon name="log-out-outline"></ion-icon>
          <span>Cerrar sesión</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard-sidebar.component.scss'],
})
export class DashboardSidebarComponent {
  @Input() user: User | any = null;
  @Input() activeMenuItem: string = 'dashboard';
  @Output() menuItemSelected = new EventEmitter<string>();
  @Output() logoutRequested = new EventEmitter<void>();

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private authService: AuthService,
  ) {}

  formatImageUrl(path: string): string {
    if (!path) return '/assets/images/default_user.png';
    return path;
  }

  navigateTo(route: string): void {
    this.menuItemSelected.emit(route);

    if (route === 'appointments') {
      this.navCtrl.navigateForward('/appointment/viewer');
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.authService.logout();
            this.navCtrl.navigateRoot('/auth/login');
          },
        },
      ],
    });

    await alert.present();
  }

  handleMenuItemSelected(menuItem: string) {
    this.activeMenuItem = menuItem;
  }
}
