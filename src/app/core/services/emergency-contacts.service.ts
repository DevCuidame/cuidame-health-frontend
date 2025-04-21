import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ContactData {
  nombre1?: string;
  telefono1?: string;
  nombre2?: string;
  telefono2?: string;
  nombre3?: string;
  telefono3?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmergencyContactsService {
  private apiUrl = environment.url;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene los contactos de emergencia del usuario actual
   */
  getMyContacts(): Observable<ApiResponse<ContactData>> {
    return this.http.get<ApiResponse<ContactData>>(`${this.apiUrl}api/contacts`);
  }

  /**
   * Crea o actualiza los contactos de emergencia del usuario
   * @param contactData Datos de los contactos
   */
  createOrUpdateContacts(contactData: ContactData): Observable<ApiResponse<ContactData>> {
    return this.http.post<ApiResponse<ContactData>>(`${this.apiUrl}api/contacts`, contactData);
  }

  /**
   * Elimina un contacto específico
   * @param contactNumber Número del contacto a eliminar (1, 2 o 3)
   */
  deleteContact(contactNumber: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}api/contacts/${contactNumber}`);
  }
}