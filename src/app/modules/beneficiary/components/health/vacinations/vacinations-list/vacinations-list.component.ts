import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';
import { SecondaryCardComponent } from 'src/app/shared/components/secondary-card/secondary-card.component';
import { faSyringe } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-vacinations-list',
  standalone: true,
  imports: [
    CommonModule, 
    EditButtonComponent, 
    SecondaryCardComponent, 
    FontAwesomeModule,
    IonicModule
  ],
  templateUrl: './vacinations-list.component.html',
  styleUrls: ['./vacinations-list.component.scss'],
})
export class VacinationsListComponent implements OnInit, OnDestroy {
  public activeBeneficiary!: Beneficiary;
  public faSyringe = faSyringe;
  public isLoading: boolean = false;
  
  // Flag para evitar cargas duplicadas
  private dataLoaded: boolean = false;

  // Subject para gestionar la cancelación de suscripciones al destruir el componente
  private destroy$ = new Subject<void>();

  constructor(
    private beneficiaryService: BeneficiaryService,
    private healthDataService: HealthDataService,
    private toastService: ToastService,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    // Suscribirse al beneficiario activo una sola vez
    this.beneficiaryService.activeBeneficiary$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
      )
      .subscribe((beneficiary) => {
        
        // Si no hay beneficiario, no hacer nada
        if (!beneficiary?.id) {
          return;
        }
        
        this.activeBeneficiary = beneficiary;
        
        // Verificar si ya tiene datos de vacunas
        if (beneficiary.health_data?.medical_info?.vaccines) {
          this.dataLoaded = true;
        } else if (!this.dataLoaded) {
          // Cargar datos solo si no se han cargado antes
          this.loadHealthData(beneficiary.id);
        }
      });
      this.refreshHealthData()

  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos de salud del beneficiario
   * @param id ID del beneficiario
   */
  loadHealthData(id: number) {
    this.isLoading = true;
    // this.presentLoading();
    
    // Usar el método getHealthData para cargar los datos
    this.healthDataService.getHealthData(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (healthData: any) => {
          
          // Marcar como cargados para evitar recargas innecesarias
          this.dataLoaded = true;
          
          if (this.activeBeneficiary) {
            // Crear una copia del beneficiario para evitar mutaciones
            const updatedBeneficiary = {
              ...this.activeBeneficiary,
              health_data: healthData
            };
            
            // Actualizar localmente, sin llamar a setActiveBeneficiary
            this.activeBeneficiary = updatedBeneficiary;
          }
          
          this.isLoading = false;
          this.dismissLoading();
        },
        (error: any) => {
          console.error('Error al cargar datos de salud:', error);
          this.toastService.presentToast('Error al cargar información de salud', 'danger');
          this.isLoading = false;
          this.dismissLoading();
        }
      );
  }

  /**
   * Refresca los datos de salud del beneficiario
   */
  refreshHealthData() {
    if (!this.activeBeneficiary?.id) {
      console.warn('No hay un beneficiario activo para actualizar sus datos de salud');
      return;
    }
    
    this.isLoading = true;
    // this.presentLoading();
    
    // Forzar recarga desde el servidor
    this.healthDataService.getHealthData(this.activeBeneficiary.id, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (healthData: any) => {
          
          if (this.activeBeneficiary) {
            // Actualizar solo localmente, sin llamar a setActiveBeneficiary
            this.activeBeneficiary = {
              ...this.activeBeneficiary,
              health_data: healthData
            };
          }
          
          this.isLoading = false;
          this.dismissLoading();
        },
        (error: any) => {
          console.error('Error al actualizar datos de salud:', error);
          this.toastService.presentToast('Error al actualizar información de salud', 'danger');
          this.isLoading = false;
          this.dismissLoading();
        }
      );
  }

  // /**
  //  * Muestra un indicador de carga
  //  */
  // async presentLoading() {
  //   const loading = await this.loadingController.create({
  //     message: 'Cargando vacunas...',
  //     spinner: 'circular',
  //     backdropDismiss: false
  //   });
  //   await loading.present();
  // }

  /**
   * Cierra el indicador de carga
   */
  async dismissLoading() {
    try {
      await this.loadingController.dismiss();
    } catch (error) {
    }
  }

  /**
   * Verifica si hay vacunas para mostrar
   */
  get hasVaccinesToShow(): boolean {
    return (this.activeBeneficiary?.health_data?.medical_info?.vaccines?.length ?? 0) > 0;
  }
}