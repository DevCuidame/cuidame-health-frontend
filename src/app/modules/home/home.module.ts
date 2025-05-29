import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';

// Pages
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings.component';

// Components
import { DashboardSidebarComponent } from 'src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardMainComponent } from 'src/app/shared/components/dashboard-main/dashboard-main.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    HomeRoutingModule,
    SharedModule
  ]
})
export class HomeModule { }
