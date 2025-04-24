import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonicModule,
  AlertController,
  NavController,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { Plan } from 'src/app/core/interfaces/plan.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { environment } from 'src/environments/environment';
import { Subscription, catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-beneficiary-card',
  imports: [IonicModule, CommonModule],
  standalone: true,
  template: `
    <div class="card-container">
      <!-- Indicador de carga -->
      <ng-container *ngIf="isLoading">
        <div class="loading-container">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Cargando beneficiarios...</p>
        </div>
      </ng-container>

      <!-- Error -->
      <ng-container *ngIf="hasError && !isLoading">
        <div class="error-container">
          <ion-icon name="alert-circle-outline" color="danger"></ion-icon>
          <p>No se pudieron cargar los beneficiarios</p>
          <button class="retry-button" (click)="refreshBeneficiaries()">
            <ion-icon name="refresh-outline"></ion-icon>
            Reintentar
          </button>
        </div>
      </ng-container>
      
      <!-- Mensaje sin beneficiarios -->
      <ng-container *ngIf="!isLoading && !hasError && sortedBeneficiaries.length === 0">
        <div class="empty-state">
          <ion-icon name="people-outline"></ion-icon>
          <p>No tienes beneficiarios registrados</p>
        </div>
      </ng-container>
      
      <!-- Tarjetas de beneficiarios -->
      <ng-container *ngIf="!isLoading && !hasError">
        <div *ngFor="let beneficiary of sortedBeneficiaries" class="card" (click)="goToBeneficiary(beneficiary)">
          <div class="card-header">
            <div class="delete-button" (click)="confirmDelete(beneficiary, $event)">
              <ion-icon name="close-circle"></ion-icon>
            </div>
          </div>
          
          <div class="card-avatar">
            <img 
              [src]="beneficiary.photourl ? formatImageUrl(beneficiary.photourl) : (beneficiary.imagebs64 || '/assets/images/default_user.png')" 
              [alt]="beneficiary.nombre"
              loading="lazy"
              (error)="handleImageError($event)"
            />
            <img class="crown" src="/assets/icon/crown.svg" alt="status" />
          </div>

          <h3>{{ beneficiary.nombre }}</h3>
        </div>
      </ng-container>

      <!-- Botón para agregar un nuevo beneficiario -->
      <div class="add-card" (click)="createBeneficiary()">
        <div class="add-circle">
          <ion-icon name="add-outline"></ion-icon>
        </div>
        <div class="add-text">Agregar</div>
      </div>
    </div>
  `,
  styleUrls: ['./beneficiary-card.component.scss'],
})
export class BeneficiaryCardComponent implements OnInit, OnDestroy {
  @Input() plan?: Plan;

  @Input() beneficiaries: Beneficiary[] = [];
  public environment = environment.url;
  public maxBeneficiaries: number = 5;
  public screenWidth: number;
  public isLoading: boolean = false;
  public hasError: boolean = false;
  public loadingTimeout: any = null;
  
  private subscription = new Subscription();

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private beneficiaryService: BeneficiaryService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.screenWidth = window.innerWidth;
  }

  ngOnInit() {
    // Suscribirse a los cambios en la lista de beneficiarios
    this.subscription.add(
      this.beneficiaryService.beneficiaries$.subscribe(beneficiaries => {
        this.beneficiaries = beneficiaries;
      })
    );
    
    // Suscribirse al estado de carga
    this.subscription.add(
      this.beneficiaryService.isLoading$.subscribe(isLoading => {
        this.isLoading = isLoading;
        
        // Si el estado de carga pasa a falso y no hay beneficiarios, verificar
        // si hubo un error en lugar de estar realmente vacío
        if (!isLoading && this.beneficiaries.length === 0) {
          this.checkErrorState();
        }
      })
    );
    
    // Obtener beneficiarios al iniciar
    this.refreshBeneficiaries();
    
    // Configurar un timeout de seguridad para la carga
    this.loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.hasError = true;
        console.warn('Timeout de carga superado para beneficiarios');
      }
    }, 15000); // 15 segundos
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
    
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }
  
  // Verificar si hubo un error en lugar de estar realmente vacío
  private checkErrorState() {
    this.hasError = false;
    
    // Si no tenemos datos, intentar una recarga silenciosa
    if (this.beneficiaries.length === 0) {
      this.beneficiaryService.fetchBeneficiaries()
        .pipe(
          catchError(error => {
            this.hasError = true;
            return of([]);
          }),
          finalize(() => {
            // Limpiar timeout de seguridad
            if (this.loadingTimeout) {
              clearTimeout(this.loadingTimeout);
              this.loadingTimeout = null;
            }
          })
        )
        .subscribe();
    }
  }
  
  refreshBeneficiaries() {
    this.hasError = false;
    this.beneficiaryService.fetchBeneficiaries().subscribe({
      error: (error) => {
        console.error('Error al cargar beneficiarios:', error);
        this.hasError = true;
        // No mostramos toast aquí para evitar duplicados con el servicio
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
  }

  async goToBeneficiary(beneficiary: Beneficiary) {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando perfil...',
      duration: 5000 // Máximo 5 segundos
    });
    
    await loading.present();
    
    try {
      await this.beneficiaryService.setActiveBeneficiary({ ...beneficiary });
      this.navCtrl.navigateForward(['/beneficiary/home']);
    } catch (error) {
      console.error('Error al navegar a beneficiario:', error);
      this.showToast('No se pudo acceder al perfil del beneficiario');
    } finally {
      loading.dismiss();
    }
  }

  get sortedBeneficiaries(): Beneficiary[] {
    return [...this.beneficiaries].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }

  async createBeneficiary() {
    // Verificar primero si puede crear más beneficiarios
    if (this.beneficiaries.length >= this.maxBeneficiaries) {
      this.showAlert(
        'Límite alcanzado',
        `Has alcanzado el límite de ${this.maxBeneficiaries} beneficiarios. Actualiza tu plan para agregar más.`
      );
      return;
    }
    
    this.router.navigate(['/code/code-lookup']);
  }
  
  async confirmDelete(beneficiary: Beneficiary, event: Event) {
    // Detener la propagación para evitar navegar al beneficiario
    event.stopPropagation();
    
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar a ${beneficiary.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteBeneficiary(beneficiary.id);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  deleteBeneficiary(id: number | string) {
    this.beneficiaryService.removeBeneficiary(id).subscribe({
      error: (error) => {
        console.error('Error al eliminar beneficiario:', error);
        this.showToast('No se pudo eliminar el beneficiario');
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
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

  // Método para manejar errores de carga de imagen
  handleImageError(event: any) {
    event.target.src = '/assets/images/default_user.png';
  }
}