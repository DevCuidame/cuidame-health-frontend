// src/app/modules/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AuthInterceptor } from '../../core/interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthLayoutComponent } from 'src/app/modules/auth/components/auth-container/auth-layout.component';

const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
  providers: [
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InitialLayoutModule {}