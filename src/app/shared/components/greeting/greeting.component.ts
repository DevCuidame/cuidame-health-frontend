import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-greeting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './greeting.component.html',
  styleUrls: ['./greeting.component.scss']
})
export class GreetingComponent implements OnInit {
  @Input() userName: string = '';
  greeting: string = '';

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
}