import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';
import { GreetingComponent } from './components/greeting/greeting.component';
import { AnimatedCounterComponent } from './components/animated-counter/animated-counter.component';
import { BeneficiaryCardComponent } from './components/beneficiary-card/beneficiary-card.component';

// Components

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    TabBarComponent,
    GreetingComponent,
    AnimatedCounterComponent,
    BeneficiaryCardComponent
  ],
  exports: [
    
  ]
})
export class SharedModule { }
