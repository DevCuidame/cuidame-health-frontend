import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const apiUrl = environment.url;

@Injectable({ providedIn: 'root' })
export class LocationService {
  private departmentsSubject = new BehaviorSubject<any[]>([]);
  private citiesSubject = new BehaviorSubject<any[]>([]);

  public departments$ = this.departmentsSubject.asObservable();
  public cities$ = this.citiesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Cargar departamentos solo si no están en caché
  fetchDepartments(): void {
    if (this.departmentsSubject.value.length === 0) {
      this.http.get<any>(`${apiUrl}api/locations/departments`).pipe(
        map(response => response.data), 
        tap(departments => this.departmentsSubject.next(departments)) 
      ).subscribe();
    }
  }

  // Cargar ciudades por departamento
  fetchCitiesByDepartment(departmentId: number): void {
    this.http.get<any>(`${apiUrl}api/locations/townships/${departmentId}`).pipe(
      map(response => response.data), 
      tap(cities => this.citiesSubject.next(cities)) 
    ).subscribe();
  }

  // Obtener datos directamente sin suscripción
  getDepartments(): any[] {
    return this.departmentsSubject.value;
  }

  getCities(): any[] {
    return this.citiesSubject.value;
  }
}
