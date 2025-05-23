import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ContainterDashComponent } from './callCenter/components/containter-dash/containter-dash.component';
import { PendingAppointmentsComponent } from './pages/pending-appointments/pending-appointments.component';
import { AppointmentAssignmentComponent } from './pages/appointment-assignment/appointment-assignment.component';
import { DailyAppointmentsComponent } from './pages/daily-appointments/daily-appointments.component';


const routes: Routes = [
  {
    path: 'dash',
    component: ContainterDashComponent,
    children: [
      { path: 'assigment', component: AppointmentAssignmentComponent },
      { path: 'pending', component: PendingAppointmentsComponent },
      { path: 'daily', component: DailyAppointmentsComponent },
      { path: '', redirectTo: 'assigment', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'dash/assigment', pathMatch: 'full' },
  { path: '**', redirectTo: 'dash/assigment' }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes), IonicModule],
})
export class AdminPanelModule {}
