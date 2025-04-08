import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from '../modules/auth/services/auth.service';
import { UserService } from '../modules/auth/services/user.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule 
  ],
  providers: [
    AuthService,
    AuthGuard,
    UserService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule ya ha sido cargado. Importarlo solo en AppModule.');
    }
  }
}
