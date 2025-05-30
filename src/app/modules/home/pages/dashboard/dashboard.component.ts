import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { User } from 'src/app/core/interfaces/auth.interface';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { environment } from 'src/environments/environment';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryCardComponent } from 'src/app/shared/components/beneficiary-card/beneficiary-card.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { Subscription } from 'rxjs';
import { GreetingComponent } from 'src/app/shared/components/greeting/greeting.component';
import { AnimatedCounterComponent } from 'src/app/shared/components/animated-counter/animated-counter.component';
import { DashboardSidebarComponent } from 'src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardMainComponent } from 'src/app/shared/components/dashboard-main/dashboard-main.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TabBarComponent,
    BeneficiaryCardComponent,
    FontAwesomeModule,
    GreetingComponent,
    AnimatedCounterComponent,
    DashboardSidebarComponent,
    DashboardMainComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  public user: User | any = null;
  public beneficiaries: Beneficiary[] = [];
  public environment = environment.url;
  public profileImage: string = '';
  public count: number = 0;
  public isDesktop: boolean = false;
  public activeMenuItem: string = 'dashboard';
  
  private subscriptions: Subscription[] = [];
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private navCtrl: NavController,
    private alertController: AlertController,
    private beneficiaryService: BeneficiaryService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkScreenSize();
    this.loadUser();
    this.loadBeneficiaries();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  checkScreenSize() {
    this.isDesktop = window.innerWidth >= 992;
        
  }

  loadUser() {
    const userSub = this.userService.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.cdRef.detectChanges();
      }
    });

    this.subscriptions.push(userSub);
  }

  loadBeneficiaries() {
    const beneficiarySub = this.beneficiaryService.beneficiaries$.subscribe(
      (beneficiaries) => {
        if (Array.isArray(beneficiaries)) {
          this.beneficiaries = beneficiaries.map((beneficiary) => ({
            ...beneficiary,
            image:
              Array.isArray(beneficiary.image) && beneficiary.image.length > 0
                ? beneficiary.image[0]
                : null,
          }));
          this.count = this.beneficiaries.length;
          this.cdRef.detectChanges();
        }
      }
    );

    this.subscriptions.push(beneficiarySub);
  }

  formatImageUrl(path: string): string {
    if (!path) return '/assets/images/default_user.png';
    return path;
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.authService.logout();
            this.navCtrl.navigateRoot('/auth/login');
          },
        },
      ],
    });

    await alert.present();
  }

  handleMenuItemSelected(menuItem: string) {
    this.activeMenuItem = menuItem;
  }
}