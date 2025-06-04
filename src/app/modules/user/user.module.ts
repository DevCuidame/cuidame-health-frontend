import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ContactsPage } from './pages/contacts/contacts.component';

const routes: Routes = [
  {
    path: 'contacts',
    component: ContactsPage,
    canActivate: [AuthGuard]
  },
  {
    path: 'change-password',
    loadComponent: () => 
      import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class UserModule { }