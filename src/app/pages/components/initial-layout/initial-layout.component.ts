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
      </div>
    </ion-content>
    <app-tab-bar
      [isVisible]="true"
      [buttons]="[
        { icon: 'arrow-back-outline', route: '/home', visible: true },
        { icon: 'menu-outline', route: '/', visible: true },
        { icon: 'exit-outline', route: '/', visible: true }
      ]"
      [background]="'var(--ion-color-light)'"
    ></app-tab-bar>
  `,
  styleUrls: ['./initial-layout.component.scss']
})
export class InitialLayoutComponent {
  currentRoute: string = '';

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  navigateTo(path: string): void {
    this.router.navigate(['/auth' + path]);
  }
}