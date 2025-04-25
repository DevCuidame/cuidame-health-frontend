// Modificación para el loading.service.ts
import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loading: HTMLIonLoadingElement | null = null;
  private loadingQueue: string[] = [];
  private safetyTimeout: any = null;

  constructor(private loadingCtrl: LoadingController) {}

  async showLoading(message: string = 'Cargando...') {
    // Añadir a la cola
    this.loadingQueue.push(message);

    // Si ya hay un loading activo, no creamos otro
    if (this.loading) {
      try {
        // Actualizamos el mensaje si es diferente
        if (this.loading.message !== message) {
          this.loading.message = message;
        }
      } catch (error) {
        console.warn('Error al actualizar mensaje del loading:', error);
      }
      return;
    }

    try {
      this.loading = await this.loadingCtrl.create({ 
        message,
        spinner: 'crescent',
        backdropDismiss: false
      });
      
      await this.loading.present();
      
      // Configurar timeout de seguridad
      this.setSafetyTimeout();
    } catch (error) {
      console.error('Error al mostrar loading:', error);
      this.hideAllLoadings(); // Limpiar estado en caso de error
    }
  }

  async hideLoading(forceHide: boolean = false) {
    // Removemos el último mensaje de la cola
    if (this.loadingQueue.length > 0) {
      this.loadingQueue.pop();
    }

    // Si la cola aún tiene mensajes y no es forzado, no cerramos el loading
    if (this.loadingQueue.length > 0 && !forceHide) {
      try {
        // Actualizamos el mensaje al último de la cola
        if (this.loading) {
          this.loading.message = this.loadingQueue[this.loadingQueue.length - 1];
        }
      } catch (error) {
        console.warn('Error al actualizar mensaje después de pop:', error);
        this.hideAllLoadings(); // En caso de error, limpiar todo
      }
      return;
    }

    // Si no hay más mensajes o es forzado, cerramos el loading
    await this.dismissCurrentLoading();
  }

  // Método para forzar el cierre de todos los loadings
  async hideAllLoadings() {
    // Limpiamos el timeout de seguridad si existe
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    
    this.loadingQueue = [];
    await this.dismissCurrentLoading();
  }
  
  // Verifica si hay un loading activo
  isLoading(): boolean {
    return this.loading !== null;
  }
  
  // Método privado para cerrar el loading actual
  private async dismissCurrentLoading() {
    if (this.loading) {
      try {
        await this.loading.dismiss();
      } catch (error) {
        console.warn('Error al cerrar el loading (posiblemente ya cerrado):', error);
      } finally {
        this.loading = null;
      }
    }
  }
  
  // Configura un timeout de seguridad para evitar que el loading se quede indefinidamente
  private setSafetyTimeout() {
    // Limpia el timeout anterior si existe
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
    }
    
    // Nuevo timeout de 10 segundos
    this.safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout: forzando cierre de loading después de 10 segundos');
      this.hideAllLoadings();
    }, 10000);
  }
}