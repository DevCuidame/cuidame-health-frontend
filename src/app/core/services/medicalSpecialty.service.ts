import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import {
  MedicalSpecialty,
  MedicalSpecialtyResponse,
} from '../interfaces/medicalSpecialty.interface';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MedicalSpecialtyService {
  private cacheKey = 'medicalSpecialtiesCache';
  public specialties = signal<MedicalSpecialty[]>([]);
  public api = environment.url;
  public version = 'api/v1/';

  constructor(private http: HttpClient) {
    this.loadFromCache(); // Cargar datos desde localStorage si existen
  }

  /**
   * Obtiene las especialidades médicas desde la API o caché
   */
  fetchMedicalSpecialties(): Observable<MedicalSpecialty[]> {
    // if (this.specialties().length > 0) {
    //   return of(this.specialties());
    // }

    return this.http.get<MedicalSpecialtyResponse>(`${this.api}${this.version}medical-specialties/all`).pipe(
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
  private saveToCache(data: MedicalSpecialty[]): void {
    this.specialties.set(data);
    localStorage.setItem(this.cacheKey, JSON.stringify(data));
  }

  /**
   * Carga los datos desde localStorage si existen
   */
  private loadFromCache(): void {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (cachedData) {
      this.specialties.set(JSON.parse(cachedData));
    }
  }

  /**
   * Limpia la caché de especialidades
   */
  clearCache(): void {
    this.specialties.set([]);
    localStorage.removeItem(this.cacheKey);
  }
}
