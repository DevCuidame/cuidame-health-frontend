import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HeaderDashComponent } from '../header-dash/header-dash.component';
import { SidebarDashComponent } from '../sidebar-dash/sidebar-dash.component';
import { filter } from 'rxjs';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { User } from 'src/app/core/interfaces/auth.interface';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-containter-dash',
  imports: [CommonModule, RouterModule, HeaderDashComponent, SidebarDashComponent],
  templateUrl: './containter-dash.component.html',
  styleUrls: ['./containter-dash.component.scss'],
})
export class ContainterDashComponent  implements OnInit {
  public isVisible: boolean = false;
  public user: User | any = null;
  public profileImage: string = '';

  constructor(private router: Router, 
    private userService: UserService,

  ) { }

  ngOnInit() {

    this.userService.user$.subscribe((userData) => {
      this.user =
        Array.isArray(userData) && userData.length > 0 ? userData[0] : userData;
      if (this.user?.image?.image_path) {
        this.profileImage = `${
          environment.url
        }${this.user.image.image_path.replace(/\\/g, '/')}`;
      } else {
        this.profileImage = 'assets/images/default_user.png';
      }
    });


    this.router.events
          .pipe(filter(event => event instanceof NavigationEnd))
          .subscribe((event: NavigationEnd) => {
            const url = event.url;
            if (url.includes('/daily')) {
              this.isVisible = true;
            } else if (url.includes('/pending')) {
              this.isVisible = false;
            } else if (url.includes('/assigment')) {
              this.isVisible = true;
            }
          });
  }

}
