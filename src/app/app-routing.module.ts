import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard, AutoRedirectGuard } from './core/guards/auth.guard';
import { VerifyEmailComponent } from './modules/auth/pages/verify-email/verify-email.component';

const routes: Routes = [
  {
    path: 'reset-password',
    loadChildren: () => import('./modules/auth/pages/new-password/new-password.module').then(m => m.NewPasswordModule)
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule),
  },

  {
    path: 'code',
    loadChildren: () => import('./pages/components/initial-layout.module').then(m => m.InitialLayoutModule),
  },

  { 
    path: 'home', 
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule), 
    canActivate: [AuthGuard]
  },
  { 
    path: 'beneficiary', 
    loadChildren: () => import('./modules/beneficiary/beneficiary.module').then(m => m.BeneficiaryModule), 
    canActivate: [AuthGuard]
  },

  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
