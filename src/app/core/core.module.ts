import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from '../modules/auth/services/auth.service';
import { UserService } from '../modules/auth/services/user.service';
import { BeneficiaryService } from './services/beneficiary.service';
import { LoadingService } from './services/loading.service';
import { ToastService } from './services/toast.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule 
  ],
  providers: [
    // Servicios principales
    LoadingService,
    ToastService,
    // Servicios de autenticación
    AuthService,
    AuthGuard,
    UserService,
    // Servicios específicos
    BeneficiaryService,
    // Interceptores HTTP
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: AuthInterceptor, 
      multi: true 
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule ya ha sido cargado. Importarlo solo en AppModule.');
    }
  }
}