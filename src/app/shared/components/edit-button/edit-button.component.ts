import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-edit-button',
  imports:[ IonicModule],
  templateUrl: './edit-button.component.html',
  styleUrls: ['./edit-button.component.scss'],
})
export class EditButtonComponent {
  @Input() route!: string; 

  constructor(private router: Router) {}

  navigate() {
    if (this.route) {
      this.router.navigate([this.route]);
    }
  }
}
