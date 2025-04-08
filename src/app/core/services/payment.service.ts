import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Plan {
  id: number;
  name: string;
  code?: string;
  description: string;
  price: number;
  duration_days: number;
  max_beneficiaries: number;
  is_active: boolean;
  created_at: string;
}

export interface PaymentTransaction {
  transactionId: string;
  publicKey: string;
  redirectUrl: string;
}

export interface PaymentHistory {
  id: number;
  user_id: number;
  plan_id: number;
  amount: number;
  payment_method: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  plan_name: string;
  plan_description: string;
}

// Interfaz para manejar la estructura de respuesta de tu API
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseUrl = environment.url || 'http://localhost:3000/api/v1';

  constructor(
    private http: HttpClient,
    private modalController: ModalController
  ) {}

  /**
   * Obtiene todos los planes disponibles
   */
  getPlans(): Observable<Plan[]> {
    return this.http.get<ApiResponse<Plan[]> | Plan[]>(`${this.baseUrl}api/v1/plans/all`)
      .pipe(
        map(response => {
          // Verificar si la respuesta tiene la estructura esperada
          if (response && typeof response === 'object' && 'data' in response) {
            // Es un ApiResponse
            return (response as ApiResponse<Plan[]>).data;
          } else {
            // Es directamente un array
            return response as Plan[];
          }
        }),
        catchError(error => {
          console.error('Error obteniendo planes:', error);
          return throwError(() => new Error('No se pudieron cargar los planes'));
        })
      );
  }


   /**
   * Abre la página de pago de Wompi dentro de un modal en vez de una ventana emergente
   */
   async openInlinePayment(paymentTransaction: PaymentTransaction): Promise<boolean> {
    // Importar el componente dinámicamente para evitar dependencias circulares
    const { InlinePaymentComponent } = await import('../../shared/components/inline-payment/inline-payment.component');

    const modal = await this.modalController.create({
      component: InlinePaymentComponent,
      componentProps: {
        paymentUrl: paymentTransaction.redirectUrl
      },
      cssClass: 'payment-modal',
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    return data?.success || false;
  }
  

  /**
   * Inicia una transacción de pago con Wompi
   */
  initiatePayment(planId: number): Observable<PaymentTransaction> {
    return this.http.post<ApiResponse<PaymentTransaction> | PaymentTransaction>(
      `${this.baseUrl}api/v1/payments/create`, 
      { planId }
    ).pipe(
      map(response => {
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ApiResponse<PaymentTransaction>).data;
        } else {
          return response as PaymentTransaction;
        }
      }),
      catchError(error => {
        console.error('Error iniciando pago:', error);
        return throwError(() => new Error('No se pudo iniciar el pago'));
      })
    );
  }

  /**
   * Verifica el estado de una transacción
   */
  verifyTransaction(transactionId: string): Observable<boolean> {
    return this.http.get<ApiResponse<{success: boolean}> | {success: boolean}>(
      `${this.baseUrl}api/v1/payments/verify/${transactionId}`
    ).pipe(
      map(response => {
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ApiResponse<{success: boolean}>).data.success;
        } else {
          return (response as {success: boolean}).success;
        }
      }),
      catchError(error => {
        console.error('Error verificando transacción:', error);
        return throwError(() => new Error('No se pudo verificar la transacción'));
      })
    );
  }

  /**
   * Obtiene el historial de pagos del usuario
   */
  getPaymentHistory(): Observable<PaymentHistory[]> {
    return this.http.get<ApiResponse<PaymentHistory[]> | PaymentHistory[]>(
      `${this.baseUrl}api/v1/payments/history`
    ).pipe(
      map(response => {
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ApiResponse<PaymentHistory[]>).data;
        } else {
          return response as PaymentHistory[];
        }
      }),
      catchError(error => {
        console.error('Error obteniendo historial de pagos:', error);
        return throwError(() => new Error('No se pudo obtener el historial de pagos'));
      })
    );
  }

  /**
   * Abre la ventana de pago de Wompi
   */
  openWompiCheckout(paymentTransaction: PaymentTransaction): Window | null {
    return window.open(
      paymentTransaction.redirectUrl,
      '_blank',
      'width=800,height=600'
    );
  }
}