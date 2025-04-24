import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, NavController, LoadingController } from '@ionic/angular';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryHeaderComponent } from 'src/app/shared/components/beneficiary-header/beneficiary-header.component';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { BasicDataComponent } from 'src/app/shared/components/basic-data/basic-data.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, Event } from '@angular/router';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';
import { HomeOptionsComponent } from 'src/app/shared/components/home-options/home-options.component';
import { Subscription, filter, of, switchMap } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';

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
  public isLoading: boolean = false;
  
  // Variables para controlar animaciones y visibilidad
  public showCategoriesMenu: boolean = true;
  public isMenuAnimating: boolean = false;

  // URLs donde las categorías no deben mostrarse
  private hideMenuOnUrls: string[] = [
    '/beneficiary/home/parameters',
    '/beneficiary/home/control-medicaments',
    '/beneficiary/home/services'
  ];
  
  private subscriptions: Subscription = new Subscription();

  public categories: { label: string; route: string }[] = [
    { label: 'Condiciones', route: 'conditions' },
    { label: 'Antecedentes', route: 'medical-history' },
    { label: 'Alergias', route: 'medicaments-allergies' },
    { label: 'Vacunas', route: 'vacinations' }
  ];

  constructor(
    private beneficiaryService: BeneficiaryService,
    private navCtrl: NavController,
    private router: Router,
    private loadingController: LoadingController,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.checkCurrentUrl(this.router.url);
    
    // Escuchar cambios en la ruta
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.checkCurrentUrl(event.url);
        })
    );

    // Suscribirse al estado de carga del servicio
    this.subscriptions.add(
      this.beneficiaryService.isLoading$.subscribe(isLoading => {
        this.isLoading = isLoading;
      })
    );

    // Obtener beneficiario activo
    this.subscriptions.add(
      this.beneficiaryService.activeBeneficiary$
        .pipe(
          switchMap(beneficiary => {
            this.activeBeneficiary = beneficiary;
            
            // Si no hay beneficiario activo, redirigir al dashboard
            if (!beneficiary) {
              this.navCtrl.navigateRoot(['/home/dashboard']);
              return of(null);
            }
            
            // Si el beneficiario activo no tiene datos completos, cargarlos
            if (beneficiary && (!beneficiary.health_data || !beneficiary.health_data.medical_info)) {
              return this.loadBeneficiaryDetails(beneficiary.id);
            }
            
            return of(beneficiary);
          })
        )
        .subscribe(beneficiary => {
          // Actualizar el beneficiario activo con los datos completos
          if (beneficiary) {
            this.activeBeneficiary = beneficiary;
          }
        })
    );

    // Establecer la categoría inicial basada en la ruta actual
    const currentRoute = this.router.url.split('/').pop();
    const foundCategory = this.categories.find(cat => cat.route === currentRoute);
    if (foundCategory) {
      this.selectedOption = foundCategory.label;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Carga los datos detallados de un beneficiario
   */
  private loadBeneficiaryDetails(beneficiaryId: number | string) {
    return this.beneficiaryService.getBeneficiaryById(beneficiaryId);
  }
 
  /**
   * Verifica la URL actual para determinar qué componentes mostrar
   */
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

  /**
   * Verifica si una opción está seleccionada
   */
  isSelected(optionLabel: string): boolean {
    return this.selectedOption === optionLabel;
  }

  /**
   * Selecciona una opción del menú y navega a la ruta correspondiente
   */
  selectOption(optionRoute: string) {
    const category = this.categories.find(cat => cat.route === optionRoute);
    if (category) {
      this.selectedOption = category.label;
    }
    
    this.router.navigate(['/beneficiary/home', optionRoute]);
  }
  
  /**
   * Refresca los datos del beneficiario activo
   */
  refreshBeneficiary() {
    if (!this.activeBeneficiary) {
      return;
    }
    
    this.loadBeneficiaryDetails(this.activeBeneficiary.id).subscribe({
      next: (beneficiary) => {
        if (beneficiary) {
          this.beneficiaryService.setActiveBeneficiary(beneficiary);
          this.toastService.presentToast('Información actualizada', 'success');
        }
      },
      error: (error) => {
        console.error('Error al actualizar beneficiario:', error);
        this.toastService.presentToast('Error al actualizar la información', 'danger');
      }
    });
  }
}