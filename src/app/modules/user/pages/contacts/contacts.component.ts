import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EmergencyContactsComponent } from '../../components/emergency-contacts/emergency-contacts.component';
import { RouterModule } from '@angular/router';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';

@Component({
  selector: 'app-contacts',
  template: `
    <ion-content>
      <div class="page-container">
        <app-emergency-contacts></app-emergency-contacts>
      </div>
    </ion-content>
    
    <app-tab-bar
      [isVisible]="true"
      [buttons]="[
        { icon: 'arrow-back-outline', route: '/home/dashboard', visible: true },
        { icon: 'menu-outline', route: '/', visible: true },
        { icon: 'exit-outline', route: '/', visible: true }
      ]"
      [background]="'var(--ion-color-light)'"
    ></app-tab-bar>
  `,
  styleUrls: ['./contacts.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, EmergencyContactsComponent, RouterModule, TabBarComponent]
})
export class ContactsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}