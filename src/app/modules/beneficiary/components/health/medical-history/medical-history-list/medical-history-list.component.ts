import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { getLabel, historyTypeOptions, relativeOptions } from 'src/app/core/constants/options';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { HealthDataService } from 'src/app/core/services/healthData.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';
import { SecondaryCardComponent } from 'src/app/shared/components/secondary-card/secondary-card.component';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-medical-history-list',
  standalone: true,
  imports: [
    CommonModule, 
    EditButtonComponent, 
    SecondaryCardComponent,
    IonicModule
  ],
  templateUrl: './medical-history-list.component.html',
  styleUrls: ['./medical-history-list.component.scss'],
})
export class MedicalHistoryListComponent implements OnInit, OnDestroy {
  public activeBeneficiary: Beneficiary | null = null;
  public getLabel = getLabel;
  public historyTypeOptions = historyTypeOptions;
  public relativeOptions = relativeOptions;
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
        
        // Verificar si ya tiene datos de salud con antecedentes
        if (beneficiary.health_data?.medical_info?.backgrounds || 
            beneficiary.health_data?.medical_info?.familyBackgrounds) {
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
    this.presentLoading();
    
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
    this.presentLoading();
    
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

  /**
   * Muestra un indicador de carga
   */
  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Cargando antecedentes...',
      spinner: 'circular',
      backdropDismiss: false
    });
    await loading.present();
  }

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
   * Verifica si hay antecedentes personales para mostrar
   */
  get hasPersonalHistoryToShow(): boolean {
    return (this.activeBeneficiary?.health_data?.medical_info?.backgrounds?.length ?? 0) > 0;
  }

  /**
   * Verifica si hay antecedentes familiares para mostrar
   */
  get hasFamilyHistoryToShow(): boolean {
    return (this.activeBeneficiary?.health_data?.medical_info?.familyBackgrounds?.length ?? 0) > 0;
  }

  /**
   * Formatea la fecha para mostrarla de manera amigable
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Sin fecha';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }
}