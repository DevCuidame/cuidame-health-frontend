import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-custom-button',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './custom-button.component.html',
  styleUrls: ['./custom-button.component.scss'],
})
export class CustomButtonComponent {
  @Input() label: string = 'Botón';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() color: string = 'var(--ion-color-primary)';
  @Input() textColor: string = 'var(--ion-color-light)';
  @Input() backgroundImage: string = '';
  @Input() background: string = '';

  @Input() routerLink?: string;
  @Input() fontSize: string = '1.25rem';
  @Input() padding: string = '15px 10px';
  @Input() boxShadow?: string = 'none';


  constructor(private router: Router) {}

  handleClick(): void {
    if (this.routerLink) {
      this.router.navigateByUrl(this.routerLink);
    }
  }
}
