import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

// Tipos de color para los toasts
export type ToastColorType = 'success' | 'danger' | 'warning' | 'primary';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastQueue: Array<{
    message: string;
    color: ToastColorType;
    duration: number;
    position: 'top' | 'bottom' | 'middle';
  }> = [];
  private isToastPresenting: boolean = false;

  constructor(private toastController: ToastController) {}

  /**
   * Presenta un toast con los parámetros dados
   * @param message Mensaje a mostrar
   * @param color Color del toast (success, danger, warning, primary)
   * @param duration Duración en milisegundos
   * @param position Posición del toast (top, bottom, middle)
   */
  async presentToast(
    message: string, 
    color: ToastColorType = 'primary',
    duration: number = 3000,
    position: 'top' | 'bottom' | 'middle' = 'top'
  ) {
    // Añadir a la cola
    this.toastQueue.push({ message, color, duration, position });
    
    // Si no hay un toast presentándose, iniciar la presentación
    if (!this.isToastPresenting) {
      await this.presentNextToast();
    }
  }

  /**
   * Presenta un toast de éxito
   * @param message Mensaje a mostrar
   */
  async success(message: string) {
    await this.presentToast(message, 'success');
  }

  /**
   * Presenta un toast de error
   * @param message Mensaje a mostrar
   */
  async error(message: string) {
    await this.presentToast(message, 'danger');
  }

  /**
   * Presenta un toast de advertencia
   * @param message Mensaje a mostrar
   */
  async warning(message: string) {
    await this.presentToast(message, 'warning');
  }

  /**
   * Presenta un toast informativo
   * @param message Mensaje a mostrar
   */
  async info(message: string) {
    await this.presentToast(message, 'primary');
  }

  /**
   * Método privado para presentar el siguiente toast en la cola
   */
  private async presentNextToast() {
    if (this.toastQueue.length === 0) {
      this.isToastPresenting = false;
      return;
    }

    this.isToastPresenting = true;
    const { message, color, duration, position } = this.toastQueue.shift()!;

    const toast = await this.toastController.create({
      message,
      duration,
      position,
      color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ],
      cssClass: `toast-${color}`
    });

    // Cuando el toast se cierre, presentar el siguiente en la cola
    toast.onDidDismiss().then(() => {
      this.presentNextToast();
    });

    await toast.present();
  }
}