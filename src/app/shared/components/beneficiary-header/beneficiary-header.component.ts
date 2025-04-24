import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-beneficiary-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="beneficiary-header">
      <div class="info">
        <div class="beneficiary-name" style="font-size: 4.5vw">
          <p>
            <span class="bold">{{activeBeneficiary?.nombre}} {{activeBeneficiary?.apellido}}</span>
          </p>
        </div>
        <div class="beneficiary-name">
          <p>
            <span class="normal">¡Información vital</span> <br />
            <span class="normal">al instante!</span>
          </p>
        </div>
      </div>
      <div class="circle">
        <img 
          [src]="getImageUrl()" 
          [alt]="activeBeneficiary?.nombre || 'Avatar'"
          (error)="handleImageError($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .beneficiary-header {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: url("../../../../assets/background/background.png") no-repeat
        center center / cover;
      background-size: cover;
      background-position: top;
      background-repeat: no-repeat;
      opacity: 1;
      border-radius: 0 0px 20px 20px;
      box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
      padding: 20px;
      z-index: 10;
      position: relative;
      width: 100%;
    }
    
    .beneficiary-name {
      color: var(--ion-color-light);
      font-size: 3.5vw;
      font-weight: bold;
    }
    
    .beneficiary-name .normal {
      font-weight: normal !important;
    }
    
    .circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 120px;
      min-height: 120px;
      background-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }
    
    @media (max-width: 480px) {
      .beneficiary-name {
        font-size: 4vw;
      }
      
      .circle {
        width: 100px;
        height: 100px;
        min-width: 100px;
        min-height: 100px;
      }
    }
  `]
})
export class BeneficiaryHeaderComponent implements OnInit, OnDestroy {
  public environment = environment.url;
  public activeBeneficiary: Beneficiary | null = null;
  private subscription: Subscription = new Subscription();

  constructor(private beneficiaryService: BeneficiaryService) {}

  ngOnInit() {
    this.subscription.add(
      this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
        this.activeBeneficiary = beneficiary;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Obtiene la URL de la imagen del beneficiario
   */
  getImageUrl(): string {
    // Si hay photourl, usar esa
    if (this.activeBeneficiary?.photourl) {
      return this.formatImageUrl(this.activeBeneficiary.photourl);
    }
    
    // Si hay imagebs64, usar esa
    if (this.activeBeneficiary?.imagebs64) {
      return this.activeBeneficiary.imagebs64;
    }
    
    // Si no hay nada, usar imagen por defecto
    return '/assets/images/default_user.png';
  }

  /**
   * Formatea la URL de la imagen
   */
  private formatImageUrl(url: string): string {
    if (!url) return '';
    
    let formattedUrl = url.replace(/\\/g, '/');
    
    const apiUrl = this.environment.endsWith('/') 
      ? this.environment.slice(0, -1) 
      : this.environment;
      
    if (formattedUrl.startsWith('/')) {
      formattedUrl = formattedUrl.substring(1);
    }
    
    return `${apiUrl}/${formattedUrl}`;
  }

  /**
   * Maneja errores de carga de imagen
   */
  handleImageError(event: any) {
    event.target.src = '/assets/images/default_user.png';
  }
}