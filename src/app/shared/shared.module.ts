import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CustomButtonComponent } from './components/custom-button/custom-button.component';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';
import { BasicDataComponent } from './components/basic-data/basic-data.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BeneficiaryCardComponent } from './components/beneficiary-card/beneficiary-card.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CustomButtonComponent,// ✅ Importamos los componentes standalone
    TabBarComponent,
    BasicDataComponent,
    BeneficiaryCardComponent,
    FontAwesomeModule
  ],
  exports: [CustomButtonComponent,BasicDataComponent, TabBarComponent, BasicDataComponent, BeneficiaryCardComponent ] // ✅ Los exportamos para otros módulos
})
export class SharedModule {}
