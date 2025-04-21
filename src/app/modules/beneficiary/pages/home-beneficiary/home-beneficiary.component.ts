import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryHeaderComponent } from 'src/app/shared/components/beneficiary-header/beneficiary-header.component';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { BasicDataComponent } from 'src/app/shared/components/basic-data/basic-data.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, Event } from '@angular/router';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';
import { HomeOptionsComponent } from 'src/app/shared/components/home-options/home-options.component';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-home-beneficiary',
  standalone: true, 
  imports: [
    IonicModule,
    CommonModule,
    BeneficiaryHeaderComponent,
    TabBarComponent,
    BasicDataComponent,
    RouterModule,
    EditButtonComponent,
    HomeOptionsComponent
  ],
  templateUrl: './home-beneficiary.component.html',
  styleUrls: ['./home-beneficiary.component.scss'],
})
export class HomeBeneficiaryComponent implements OnInit, OnDestroy {
  public activeBeneficiary: Beneficiary | null = null;
  public selectedOption: string = '';
  public showBasicData: boolean = true;
  
  // Variables para controlar animaciones y visibilidad
  public showCategoriesMenu: boolean = true;
  public isMenuAnimating: boolean = false;

  // URLs donde las categorías no deben mostrarse
  private hideMenuOnUrls: string[] = [
    '/beneficiary/home/parameters',
    '/beneficiary/home/control-medicaments',
    '/beneficiary/home/services'
    // Añade más URLs según sea necesario
  ];
  
  private routerSubscription: Subscription = new Subscription;

  public categories: { label: string; route: string }[] = [
    { label: 'Condiciones', route: 'conditions' },
    { label: 'Antecedentes', route: 'medical-history' },
    { label: 'Alergias', route: 'medicaments-allergies' },
    { label: 'Vacunas', route: 'vacinations' }
  ];

  constructor(
    private beneficiaryService: BeneficiaryService,
    private navCtrl: NavController,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkCurrentUrl(this.router.url);
    
    this.routerSubscription = this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkCurrentUrl(event.url);
      });

    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
      
      if (this.activeBeneficiary === null) {
        this.navCtrl.navigateRoot(['/home/dashboard']);
      }
    });

    const currentRoute = this.router.url.split('/').pop();
    const foundCategory = this.categories.find(cat => cat.route === currentRoute);
    if (foundCategory) {
      this.selectedOption = foundCategory.route;
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

 
  private checkCurrentUrl(url: string) {
    this.showBasicData = url === '/beneficiary/home';
    
    const shouldHideMenu = this.hideMenuOnUrls.some(hideUrl => url.includes(hideUrl));
    
    if (shouldHideMenu !== !this.showCategoriesMenu) {
      this.isMenuAnimating = true;
      this.showCategoriesMenu = !shouldHideMenu;
      
      setTimeout(() => {
        this.isMenuAnimating = false;
      }, 500); 
    }
  }


  isSelected(optionLabel: string): boolean {
    return this.selectedOption === optionLabel;
  }


  selectOption(optionRoute: string) {
    const category = this.categories.find(cat => cat.route === optionRoute);
    if (category) {
      this.selectedOption = category.label;
    }
    
    this.router.navigate(['/beneficiary/home', optionRoute]);
  }
}