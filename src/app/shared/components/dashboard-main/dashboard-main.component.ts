import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { User } from 'src/app/core/interfaces/auth.interface';
import { GreetingComponent } from '../greeting/greeting.component';
import { AnimatedCounterComponent } from '../animated-counter/animated-counter.component';
import { BeneficiaryCardComponent } from '../beneficiary-card/beneficiary-card.component';

@Component({
  selector: 'app-dashboard-main',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    GreetingComponent,
    AnimatedCounterComponent,
    BeneficiaryCardComponent,
  ],
  template: `
    <div class="dashboard-main">
      <div class="main-header">
        <app-greeting
          [userName]="user?.name"
          [background]="'#fff'"
          [border]="'20px'"
          [boxshadow]="'0 15px 8px rgba(0, 0, 0, 0.1);'"
          [icon]="true"
        ></app-greeting>
      </div>

      <div class="main-content">
        <div class="stats-section">
          <div class="stats-card">
            <app-animated-counter
              [targetValue]="beneficiaries.length || 0"
              [label]="'Familiares'"
              [duration]="1500"
              [showProgress]="false"
              [showConfetti]="true"
            ></app-animated-counter>
          </div>
        </div>

        <div class="beneficiaries-section">
          <h2>Mis Familiares</h2>
          <app-beneficiary-card></app-beneficiary-card>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard-main.component.scss'],
})
export class DashboardMainComponent implements OnInit {
  @Input() user: User | any = null;
  @Input() beneficiaries: Beneficiary[] = [];

  constructor() {}

  ngOnInit() {}
}
