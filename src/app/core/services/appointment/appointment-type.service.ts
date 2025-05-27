import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AppointmentType } from '../../interfaces/appointment.interface';
import { ApiResponse } from '../emergency-contacts.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentTypeService {
  private cacheKey = 'appointmentTypeCache';
  public appointmentTypes = signal<AppointmentType[]>([]);
  public api = environment.url;
  public version = 'api/';

  constructor(private http: HttpClient) {
    this.loadFromCache(); // Cargar datos desde localStorage si existen
  }

  /**
   * Obtiene las especialidades médicas desde la API o caché
   */
  fetchTypes(): Observable<AppointmentType[]> {
    // if (this.specialties().length > 0) {
    //   return of(this.specialties());
    // }

    return this.http.get<ApiResponse>(`${this.api}${this.version}appointment-types`).pipe(
      map((response) => response.data),
      tap((data) => this.saveToCache(data)), 
      catchError((error) => {
        console.error('Error al obtener especialidades médicas:', error);
        return of([]);
      })
    );
  }

  /**
   * Guarda las especialidades en caché (Signal y localStorage)
   */
  private saveToCache(data: AppointmentType[]): void {
    this.appointmentTypes.set(data);
    localStorage.setItem(this.cacheKey, JSON.stringify(data));
  }

  /**
   * Carga los datos desde localStorage si existen
   */
  private loadFromCache(): void {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (cachedData) {
      this.appointmentTypes.set(JSON.parse(cachedData));
    }
  }

  /**
   * Limpia la caché de especialidades
   */
  clearCache(): void {
    this.appointmentTypes.set([]);
    localStorage.removeItem(this.cacheKey);
  }
}
