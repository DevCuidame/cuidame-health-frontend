import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonicModule, ModalController } from '@ionic/angular';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-inline-payment',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Procesar Pago</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="iframe-container">
        <iframe 
          *ngIf="safeUrl" 
          [src]="safeUrl" 
          frameborder="0" 
          allow="accelerometer; autoplay; camera; gyroscope; payment"
          class="payment-frame"
          (load)="onIframeLoad()"
        ></iframe>
        <div *ngIf="!safeUrl" class="loading-container">
          <ion-spinner name="circular"></ion-spinner>
          <p>Cargando pasarela de pago...</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .iframe-container {
      height: 100%;
      width: 100%;
      overflow: hidden;
      position: relative;
    }
    .payment-frame {
      height: 100%;
      width: 100%;
      border: none;
      overflow: hidden;
      background-color: #f5f5f5;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .loading-container p {
      margin-top: 1rem;
      color: var(--ion-color-medium);
    }
  `]
})
export class InlinePaymentComponent implements OnInit, OnDestroy {
  @Input() paymentUrl!: string;
  @Input() transactionId!: string;
  @Output() paymentComplete = new EventEmitter<boolean>();
  
  safeUrl: SafeResourceUrl | null = null;
  checkInterval: any;

  constructor(
    private sanitizer: DomSanitizer,
    private modalController: ModalController,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    if (this.paymentUrl) {
      // Añadir parámetros para evitar caché y problemas de CSP
      const urlWithParams = `${this.paymentUrl}?_=${Date.now()}`;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
      this.startPaymentMonitoring();
    }
  }

  ngOnDestroy() {
    this.clearCheckInterval();
  }

  onIframeLoad() {
    console.log('Payment iframe loaded');
  }

  dismiss(success: boolean = false) {
    this.clearCheckInterval();
    this.modalController.dismiss({ success });
  }

  private startPaymentMonitoring() {
    if (this.transactionId) {
      console.log(`Iniciando monitoreo de transacción: ${this.transactionId}`);
      
      // Crear un intervalo para verificar periódicamente el estado de la transacción
      this.checkInterval = setInterval(async () => {
        try {
          const success = await this.paymentService.verifyTransaction(this.transactionId).toPromise();
          
          if (success) {
            console.log('Transacción aprobada!');
            this.paymentComplete.emit(true);
            this.dismiss(true);
            clearInterval(this.checkInterval);
          }
        } catch (error) {
          console.error('Error verificando estado de transacción:', error);
        }
      }, 5000); // Verificar cada 5 segundos
    }
  }

  private async checkTransactionStatus(transactionId: string) {
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { PaymentService } = await import('../../../core/services/payment.service');
      const paymentService = new PaymentService(null as any, null as any); // No es ideal, pero funciona para este caso
      
      paymentService.verifyTransaction(transactionId).subscribe({
        next: (success) => {
          if (success) {
            this.paymentComplete.emit(true);
            this.dismiss(true);
          }
        },
        error: (err) => console.error('Error verificando transacción:', err)
      });
    } catch (error) {
      console.error('Error checking transaction status', error);
    }
  }

  private clearCheckInterval() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}