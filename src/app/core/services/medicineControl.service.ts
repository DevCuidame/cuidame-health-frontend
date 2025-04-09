import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.url;

@Injectable({
  providedIn: 'root',
})
export class MedicineControl {
  constructor(private http: HttpClient) {}

  /**
   * Crea una nueva orden con los datos del formulario y archivos.
   * @param payload Datos del formulario y archivos.
   * @returns Observable con la respuesta del servidor.
   */
  createOrder(payload: any): Observable<any> {
    return this.http.post(`${baseUrl}api/medicine-control/`, payload);
  }


  /**
   * Actualiza una orden existente.
   * @param id ID de la orden a actualizar.
   * @param payload Datos actualizados del formulario y archivos.
   * @returns Observable con la respuesta del servidor.
   */
  updateOrder(id: string, payload: any): Observable<any> {
    return this.http.put(`${baseUrl}api/medicine-control/${id}`, payload);
  }

  updateDeliveryStatus(id: string, delivery_status: string): Observable<any> {
    return this.http.put(`${baseUrl}api/medicine-control/update-status/${id}`, {delivery_status});
  }
  

  /**
   * Elimina una orden por su ID.
   * @param id ID de la orden a eliminar.
   * @returns Observable con la respuesta del servidor.
   */
  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${baseUrl}api/medicine-control/${id}`);
  }

  /**
   * Obtener todas las order por ID de paciente.
   * @returns Observable con la respuesta del servidor.
   */
  getOrderByPatientId(id: string): Observable<any> {
    return this.http.get(`${baseUrl}api/medicine-control/patient/${id}`);
  }

  /**
   * Construye y guarda una imagen en el servidor.
   * @param id Id del formulario creado
   * @param fileName nombre del archivo.
   * @param type tipo del archivo.
   * @param category categoria del archivo.
   * @param base64 Contenido del archivo en base64.
   * @returns Observable con la respuesta del servidor.
   */
  uploadImages(payload: { id_order: number; images: Record<string, any> }): Observable<any> {
    return this.http.post(`${baseUrl}api/images-medicine/save`, payload);
  }
  
}
