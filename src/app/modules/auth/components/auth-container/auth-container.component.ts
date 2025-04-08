import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';
import { ResetPasswordComponent } from '../../pages/reset-password/reset-password.component';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';

@Component({
  selector: 'app-auth-container',
  standalone: true,
  imports: [CommonModule, IonicModule, LoginComponent, RegisterComponent, ResetPasswordComponent, TabBarComponent],
  templateUrl: './auth-container.component.html',
  styleUrls: ['./auth-container.component.scss']
})
export class AuthContainerComponent {
  currentView: 'login' | 'register' | 'reset-password' = 'login';

  switchView(view: 'login' | 'register' | 'reset-password') {
    this.currentView = view;
  }
}
