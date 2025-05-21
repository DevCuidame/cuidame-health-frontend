import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
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
import { GreetingComponent } from 'src/app/shared/components/greeting/greeting.component';
import { Subscription, interval, switchMap, of, catchError } from 'rxjs';
import { AnimatedCounterComponent } from 'src/app/shared/components/animated-counter/animated-counter.component';
import { StorageService } from 'src/app/core/services/storage.service';
import { CacheService } from 'src/app/core/services/cache-service';

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
    BeneficiaryCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  public user: User | any = null;
  public beneficiaries: Beneficiary[] = [];
  public environment = environment.url;
  public profileImage: string = '';
  public activeTab: string = 'info';
  public selectedButtonText: string = 'Beneficiarios';
  public selectedIndicatorBorder: string = '20px';
  public showCards: boolean = true;
  public faCrown = faCrown;
  public count: number = 0;

  private subscriptions: Subscription[] = [];
  private refreshInterval: Subscription | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private beneficiaryService: BeneficiaryService,
    private cdRef: ChangeDetectorRef,
    private navController: NavController,
    private alertController: AlertController,
    private storageService: StorageService,
    private cacheService: CacheService
  ) {}

  ngOnInit() {
    // Load initial data
    this.loadUserData();
    this.loadBeneficiaries();

    // Inicialmente intentar cargar datos del almacenamiento
    this.refreshFromStorage();
    
    // Luego, actualizar desde la API
    // this.authService.getDataFromApi().subscribe(
    //   (apiData) => {
    //     if (apiData) {
    //       // Actualizar datos del usuario con la respuesta de la API
    //       this.authService.setUser(apiData.user).subscribe();
    //     }
    //   },
    //   (error) => {
    //     console.warn('Error al obtener datos de API:', error);
    //   }
    // );

    // Start automatic refresh cycle
    // this.startAutoRefresh();
  }

  ngOnDestroy() {
    // Clean up all subscriptions to prevent memory leaks
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());

    // Stop automatic refresh interval
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }

    // Eliminar listeners de eventos
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  startAutoRefresh() {
    this.refreshInterval = interval(30000).subscribe(() => {
      if (this.user?.id) {
        this.refreshFromStorage();
      }
    });

    // Guardar referencias a las funciones vinculadas
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleWindowFocus);
  }

  handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.user?.id) {
      // When tab becomes visible again, refresh from server
      this.refreshUserDataFromServer();
    }
  }

  handleWindowFocus() {
    if (this.user?.id) {
      this.refreshUserDataFromServer();
    }
  }

  loadUserData() {
    const userSub = this.userService.user$.subscribe((userData) => {
      if (Array.isArray(userData) && userData.length > 0) {
        this.user = userData[0];
      } else {
        this.user = userData;
      }

      if (
        this.user?.location &&
        Array.isArray(this.user.location) &&
        this.user.location.length > 0
      ) {
        this.user.location = this.user.location[0];
      }

      this.updateProfileImage();
      this.cdRef.detectChanges();
    });

    this.subscriptions.push(userSub);
  }

  /**
   * Loads beneficiaries data from the BeneficiaryService
   */
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

  /**
   * Updates the profile image URL
   */
  updateProfileImage() {
    if (this.user?.path) {
      this.profileImage = `${environment.url}${this.user.path.replace(
        /\\/g,
        '/'
      )}`;
    } else if (this.user?.imagebs64) {
      this.profileImage = this.user.imagebs64;
    } else {
      this.profileImage = 'assets/images/default_profile.png';
    }
  }

  /**
   * Refreshes user data from the server
   */
  refreshUserDataFromServer() {
    if (this.user?.id) {
      // Utilizar cacheService para un acceso más eficiente a los datos
      this.cacheService.set('last_refresh_attempt', new Date().toISOString(), false);
      
      const refreshSub = this.userService
        .refreshUserData(this.user.id)
        .pipe(
          catchError(error => {
            console.warn('Error al actualizar datos del usuario:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          // Intentar obtener beneficiarios actualizados también
          this.beneficiaryService.fetchBeneficiaries().subscribe(
            () => {},
            () => this.refreshFromStorage()
          );
        });

      this.subscriptions.push(refreshSub);
    }
  }

  /**
   * Refreshes user data from storage service
   */
  refreshFromStorage() {
    // Obtener datos del usuario desde StorageService
    this.storageService.getItem('user').subscribe(userData => {
      if (userData) {
        // Actualizar userService con los datos almacenados
        this.userService.setUser(userData);
      }
    });

    // También intentar obtener beneficiarios desde el almacenamiento
    this.storageService.getItem('beneficiaries').subscribe(beneficiaries => {
      if (beneficiaries && Array.isArray(beneficiaries)) {
        this.beneficiaryService['beneficiariesSubject'].next(beneficiaries);
        this.beneficiaryService['updateBeneficiaryCount'](beneficiaries.length);
      }
    });
  }

  formatImageUrl(url: string): string {
    if (!url) return '/assets/images/default_user.png';

    let formattedUrl = url.replace(/\\/g, '/');

    const apiUrl = this.environment.endsWith('/')
      ? this.environment.slice(0, -1)
      : this.environment;

    if (formattedUrl.startsWith('/')) {
      formattedUrl = formattedUrl.substring(1);
    }

    return `${apiUrl}/${formattedUrl}`;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onPlanSelected(plan: any) {
    // Handle plan selection
  }

  goToPlans() {
    this.activeTab = 'plans-selection';
  }

  async selectButton(buttonType: string) {
    if (buttonType === 'Beneficiarios') {
      this.selectedButtonText = 'Beneficiarios';
    } else if (buttonType === 'Agenda') {
      if (this.user.plan) {
        this.selectedButtonText = 'Agenda';
        this.navController.navigateForward(['/home/appointment-booking']);
      } else {
        const alert = await this.alertController.create({
          cssClass: 'custom-alert',
          header: '¡Atención!',
          subHeader: 'Plan no disponible',
          message:
            'Actualmente no cuentas con un plan activo para acceder a la agenda.',
          buttons: [
            {
              text: 'Aceptar',
              cssClass: 'alert-button-confirm',
              handler: () => {
                this.activeTab = 'plans-selection';
              },
            },
          ],
          backdropDismiss: false,
        });

        await alert.present();
      }
    } else if (buttonType === 'Mi Salud') {
      if (this.user.plan) {
        this.selectedButtonText = 'Mi Salud';
        this.navController.navigateForward(['/user/home']);
      } else {
        const alert = await this.alertController.create({
          cssClass: 'custom-alert',
          header: '¡Atención!',
          subHeader: 'Plan no disponible',
          message:
            'Actualmente no cuentas con un plan activo para acceder a la agenda.',
          buttons: [
            {
              text: 'Aceptar',
              cssClass: 'alert-button-confirm',
              handler: () => {
                this.activeTab = 'plans-selection';
              },
            },
          ],
          backdropDismiss: false,
        });

        await alert.present();
      }
    }
  }
}