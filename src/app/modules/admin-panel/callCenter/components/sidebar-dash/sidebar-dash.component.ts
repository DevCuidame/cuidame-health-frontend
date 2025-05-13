import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';

@Component({
  selector: 'app-sidebar-dash',
  imports: [CommonModule, CustomButtonComponent],
  templateUrl: './sidebar-dash.component.html',
  styleUrls: ['./sidebar-dash.component.scss'],
})
export class SidebarDashComponent implements OnInit {
  activeButton: string = 'assigment';

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.url;
        if (url.includes('/daily')) {
          this.activeButton = 'daily';
        } else if (url.includes('/pending')) {
          this.activeButton = 'pending';
        } else if (url.includes('/assigment')) {
          localStorage.removeItem('selectedAppointment')
          this.activeButton = 'assigment';
        }
      });
  }

  setActive(button: string) {
    this.activeButton = button;
  }
}
