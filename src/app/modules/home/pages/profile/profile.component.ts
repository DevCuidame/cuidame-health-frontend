import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  imports: [IonicModule],
  template: `
    <ion-content>
      <div class="profile-container">
        <h1>Profile</h1>
        <p>This page is under construction.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .profile-container {
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
export class ProfileComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}