import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-appointments',
  imports: [IonicModule],

  template: `
    <ion-content>
      <div class="appointments-container">
        <h1>Appointments</h1>
        <p>This page is under construction.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .appointments-container {
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
export class AppointmentsComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}