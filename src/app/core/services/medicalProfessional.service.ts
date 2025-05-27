import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MedicalProfessional, MedicalProfessionalResponse } from '../interfaces/medicalProfessional.interface';

@Injectable({
  providedIn: 'root',
})
export class MedicalProfessionalService {
  private apiUrl = `${environment.url}api/v1/medical-professionals/specialty/`;
  private apiMedicalProf = `${environment.url}api/v1/medical-professionals/all`;
  private cacheKey = 'medicalProfessionalsCache';

  public professionals = signal<MedicalProfessional[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los profesionales médicos por especialidad desde la API o caché.
   * @param specialtyId - ID de la especialidad médica.
   */
  fetchMedicalProfessionals(specialtyId: number): Observable<MedicalProfessional[]> {
    if (this.professionals().length > 0 && specialtyId == null) {
      return of(this.professionals());
    }
    return this.http.get<MedicalProfessionalResponse>(`${this.apiUrl}${specialtyId}`).pipe(
      map(response => response.data),
      tap(data => this.saveToCache(data)),
      catchError(error => {
        console.error('Error al obtener profesionales médicos:', error);
        return of([]);
      })
    );
  }

   /**
   * Obtiene los profesionales médicos por especialidad desde la API o caché.
   * @param specialtyId - ID de la especialidad médica.
   */
   getMedicalProfessionals(): Observable<MedicalProfessional[]> {
    if (this.professionals().length > 0) {
      return of(this.professionals());
    }

    return this.http.get<MedicalProfessionalResponse>(`${this.apiMedicalProf}`).pipe(
      map(response => response.data),
      tap(data => this.saveToCache(data)),
      catchError(error => {
        console.error('Error al obtener profesionales médicos:', error);
        return of([]);
      })
    );
  }


  private saveToCache(data: MedicalProfessional[]): void {
    this.professionals.set(data);
    localStorage.setItem(this.cacheKey, JSON.stringify(data));
  }


  loadFromCache(): void {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (cachedData) {
      this.professionals.set(JSON.parse(cachedData));
    }
  }

  /**
   * Limpia la caché de profesionales médicos.
   */
  clearCache(): void {
    this.professionals.set([]);
    localStorage.removeItem(this.cacheKey);
  }
}
