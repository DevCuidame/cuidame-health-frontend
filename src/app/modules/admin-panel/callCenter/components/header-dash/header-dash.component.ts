// Actualización del componente header-dash.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { User } from 'src/app/core/interfaces/auth.interface';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-dash',
  imports: [CommonModule, IonicModule],
  templateUrl: './header-dash.component.html',
  styleUrls: ['./header-dash.component.scss'],
})
export class HeaderDashComponent implements OnInit {
  @Input() user: User | any = null;
  @Input() profileImage: string = 'assets/images/default_user.png';
  showProfileMenu: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
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
          cssClass: 'cancel-button',
        },
        {
          text: 'Confirmar',
          cssClass: 'confirm-button',
          handler: () => {
            this.logout();
          },
        },
      ],
    });

    await alert.present();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}