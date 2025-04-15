// src/app/modules/auth/components/auth-layout/auth-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, TabBarComponent],
  template: `
    <ion-content scroll-y="false">
      <div class="logo-container">
        <ion-img class="logo" src="assets/logo/logo.png"></ion-img>
      </div>
      <div class="card">
        <router-outlet></router-outlet>
        
        @if (currentRoute.includes('/login')) {
          <p class="toggle-text">
            ¿No tienes cuenta? <a (click)="navigateTo('/register')">Regístrate aquí</a>
          </p>
        } @else if (currentRoute.includes('/register')) {
          <p class="toggle-text">
            ¿Ya tienes cuenta? <a (click)="navigateTo('/login')">Inicia sesión</a>
          </p>
        } @else if (currentRoute.includes('/reset-password')) {
          <p class="toggle-text">
            ¿Recordaste tu contraseña?
            <a (click)="navigateTo('/login')">Inicia sesión</a>
          </p>
        }
      </div>
    </ion-content>
    <app-tab-bar
      [isVisible]="true"
      [buttons]="[
        { icon: 'arrow-back-outline', route: '/', visible: true },
        { icon: 'menu-outline', route: '/', visible: false },
        { icon: 'exit-outline', route: '/', visible: true }
      ]"
      [background]="'var(--ion-color-light)'"
    ></app-tab-bar>
  `,
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent {
  currentRoute: string = '';

  constructor(private router: Router, private route: ActivatedRoute) {
    // Suscribirse a los cambios de ruta para actualizar la variable currentRoute
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  navigateTo(path: string): void {
    this.router.navigate(['/auth' + path]);
  }
}