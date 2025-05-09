import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './greeting.component.html',
  styleUrls: ['./greeting.component.scss']
})
export class GreetingComponent implements OnInit {
  @Input() userName: string = '';
  greeting: string = '';

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
    this.setGreetingBasedOnTime();
  }

  private setGreetingBasedOnTime() {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      this.greeting = 'Buenos días';
    } else if (currentHour >= 12 && currentHour < 19) {
      this.greeting = 'Buenas tardes';
    } else {
      this.greeting = 'Buenas noches';
    }
  }

  navigateToPage() {
    this.navCtrl.navigateForward('appointment/viewer');
  }

}