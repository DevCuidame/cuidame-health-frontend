import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content>
      <div class="settings-container">
        <h1>Settings</h1>
        <p>This page is under construction.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }
    
    h1 {
      color: var(--ion-color-primary);
      margin-bottom: 20px;
    }
    
    p {
      color: var(--ion-color-medium);
      font-size: 18px;
    }
  `]
})
export class SettingsComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}