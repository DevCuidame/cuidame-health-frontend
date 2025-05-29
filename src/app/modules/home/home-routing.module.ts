import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

// Pages
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard], 
  },
  {
    path: 'appointments',
    component: AppointmentsComponent,
    canActivate: [AuthGuard], 
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard], 
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard], 
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }