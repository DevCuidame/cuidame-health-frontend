// src/app/modules/auth/services/reset-password.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordService {
  private apiUrl = environment.url;

  constructor(private http: HttpClient) {}

  /**
   * Envía solicitud para restablecer contraseña
   * @param email Email del usuario
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}api/auth/forgot-password`, { email });
  }

  /**
   * Restablece la contraseña con el token proporcionado
   * @param token Token de restablecimiento
   * @param newPassword Nueva contraseña
   */
  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}api/auth/reset-password`, { 
      token, 
      password: newPassword ,
      confirmPassword: confirmPassword
    });
  }

}