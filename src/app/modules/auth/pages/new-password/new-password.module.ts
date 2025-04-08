import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { NewPasswordComponent } from './new-password.component';

// Configurar rutas para manejar cualquier acceso a /reset-password
const routes: Routes = [
  {
    path: '',
    component: NewPasswordComponent,
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    SharedModule,
    // Importamos el componente standalone directamente
    NewPasswordComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NewPasswordModule {}