import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EmergencyContactsComponent } from '../../components/emergency-contacts/emergency-contacts.component';
import { RouterModule } from '@angular/router';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { DashboardSidebarComponent } from 'src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { User } from 'src/app/core/interfaces/auth.interface';
import { UserService } from 'src/app/modules/auth/services/user.service';

@Component({
  selector: 'app-contacts',
  template: `
    <!-- Desktop Layout -->
    <div class="desktop-layout" *ngIf="!isMobile" [style.display]="isMobile ? 'none' : 'block'">
      <div class="desktop-container">
        <!-- Sidebar -->
        <app-dashboard-sidebar [user]="currentUser"> </app-dashboard-sidebar>

        <!-- Main Content -->
        <div class="main-content">
          <div class="content-header">
            <div class="breadcrumb">
              <ion-icon name="home-outline"></ion-icon>
              <span>Dashboard</span>
              <ion-icon name="chevron-forward-outline"></ion-icon>
              <span>Contactos de Emergencia</span>
            </div>
            <h1>Contactos de Emergencia</h1>
            <p class="page-description">
              Gestiona y mantén actualizados tus contactos de emergencia para
              que puedan ser notificados cuando sea necesario.
            </p>
          </div>

          <div class="content-body">
            <app-emergency-contacts></app-emergency-contacts>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="mobile-layout" *ngIf="isMobile" [style.display]="!isMobile ? 'none' : 'block'">
      <ion-content>
        <div class="page-container">
          <app-emergency-contacts></app-emergency-contacts>
        </div>
      </ion-content>

      <app-tab-bar
        [isVisible]="true"
        [buttons]="[
          {
            icon: 'arrow-back-outline',
            route: '/home/dashboard',
            visible: true
          },
          { icon: 'ellipsis-horizontal', route: '/', visible: true },
          { icon: 'exit-outline', route: '/', visible: true }
        ]"
        [background]="'var(--ion-color-light)'"
      ></app-tab-bar>
    </div>
  `,
  styleUrls: ['./contacts.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    EmergencyContactsComponent,
    RouterModule,
    TabBarComponent,
    DashboardSidebarComponent,
  ],
})
export class ContactsPage implements OnInit {
  currentUser: User | null = null;
  isMobile: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.currentUser = this.userService.getUser();
    this.checkScreenSize();
    this.setupResizeListener();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  private setupResizeListener() {
    window.addEventListener('resize', () => {
      this.checkScreenSize();
      // Forzar detección de cambios
      setTimeout(() => {
        this.checkScreenSize();
      }, 100);
    });
  }
}
