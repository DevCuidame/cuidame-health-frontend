// error-handler.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  constructor(private toastService: ToastService) {}
  
  /**
   * Procesa errores HTTP y extrae el mensaje más relevante
   * @param error Objeto de error HTTP
   * @param defaultMessage Mensaje predeterminado en caso de no poder extraer uno específico
   * @param showToast Indica si se debe mostrar un toast con el mensaje de error
   * @returns Observable con el error original para mantener el flujo de errores
   */
  handleError(error: HttpErrorResponse, defaultMessage: string = 'Ha ocurrido un error', showToast: boolean = true): Observable<never> {
    let errorMessage = defaultMessage;
    
    // Extraer el mensaje de error del HTML si existe
    if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE html>')) {
      // Buscar el mensaje de error entre "Error:" y "<br>"
      const match = error.error.match(/Error: (.*?)<br>/);
      if (match && match[1]) {
        errorMessage = match[1].trim();
      }
    } 
    // Intentar obtener mensaje de error de un formato JSON
    else if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'object' && error.error.error) {
        errorMessage = error.error.error;
      }
    } 
    // Si hay un mensaje en el error mismo
    else if (error.message) {
      errorMessage = error.message;
    }
    // Devolver el error para mantener el flujo de observables
    return throwError(() => ({ originalError: error, message: errorMessage }));
  }
  
  /**
   * Versión simple para usar en lugares donde solo se necesita extraer el mensaje
   * @param error Objeto de error HTTP
   * @param defaultMessage Mensaje predeterminado
   * @returns String con el mensaje de error
   */
  extractErrorMessage(error: HttpErrorResponse, defaultMessage: string = 'Ha ocurrido un error'): string {
    let errorMessage = defaultMessage;
    
    if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE html>')) {
      const match = error.error.match(/Error: (.*?)<br>/);
      if (match && match[1]) {
        errorMessage = match[1].trim();
      }
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return errorMessage;
  }
}