import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { AddBeneficiaryComponent } from './pages/add-beneficiary/add-beneficiary.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { HomeBeneficiaryComponent } from './pages/home-beneficiary/home-beneficiary.component';
import { BeneficiaryHeaderComponent } from 'src/app/shared/components/beneficiary-header/beneficiary-header.component';
import { ConditionsListComponent } from './components/health/health-condition/conditions-list/conditions-list.component';
import { MedicalHistoryListComponent } from './components/health/medical-history/medical-history-list/medical-history-list.component';
import { MedicamentsAllergiesListComponent } from './components/health/allergies/medicaments-allergies-list/medicaments-allergies-list.component';
import { VacinationsListComponent } from './components/health/vacinations/vacinations-list/vacinations-list.component';
import { HealthConditionFormComponent } from './components/health/health-condition/health-condition-form/health-condition-form.component';
import { MedicalHistoryFormComponent } from './components/health/medical-history/medical-history-form/medical-history-form.component';
import { MedicamentsAllergiesFormComponent } from './components/health/allergies/medicaments-allergies-form/medicaments-allergies-form.component';
import { VacinationsFormComponent } from './components/health/vacinations/vacinations-form/vacinations-form.component';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';
import { InputComponent } from 'src/app/shared/components/input/input.component';
import { SecondaryCardComponent } from 'src/app/shared/components/secondary-card/secondary-card.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'add',
    component: AddBeneficiaryComponent,
    canActivate: [AuthGuard], 
  },
  {
    path: 'home',
    component: HomeBeneficiaryComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'conditions',
        component: ConditionsListComponent, 
      },
      {
        path: 'medical-history',
        component: MedicalHistoryListComponent, 
      },
      {
        path: 'medicaments-allergies',
        component: MedicamentsAllergiesListComponent, 
      },
      {
        path: 'vacinations',
        component: VacinationsListComponent, 
      },

      // **Rutas para los formularios**
      { path: 'conditions/form', component: HealthConditionFormComponent },

      { path: 'medical-history/form', component: MedicalHistoryFormComponent },

      { path: 'medicaments-allergies/form', component: MedicamentsAllergiesFormComponent },

      { path: 'vacinations/form', component: VacinationsFormComponent },

      {
        path: '**',
        redirectTo: 'home', 
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TabBarComponent,
    BeneficiaryHeaderComponent,
    EditButtonComponent,
    InputComponent,
    SecondaryCardComponent
  ],
})
export class BeneficiaryModule { }
