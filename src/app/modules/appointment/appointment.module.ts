import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { AppointmentViewerComponent } from './pages/appointment-viewer.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'viewer',
    component: AppointmentViewerComponent,
    canActivate: [AuthGuard], 
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
  ],
})
export class Appointmentodule {}
