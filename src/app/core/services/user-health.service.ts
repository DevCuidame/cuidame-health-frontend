import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { Allergy, Condition, FamilyBackground, MedicalBackground, Medication, Vaccine } from '../interfaces/beneficiary.interface';

export interface UserHealth {
  user_id?: number;
  allergies?: Allergy[];
  medications?: Medication[];
  medical_history?: MedicalBackground[];
  family_history?: FamilyBackground[];
  vaccinations?: Vaccine[];
}

@Injectable({ providedIn: 'root' })
export class UserHealthService {
  private apiUrl = environment.url;
  
  private userHealthSubject = new BehaviorSubject<UserHealth | null>(null);
  public userHealth$ = this.userHealthSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}
  
  getUserHealthData(): void {
    const user = this.userService.getUser();
    
    if (!user || !user.id) {
      console.error('No se encontró información del usuario.');
      return;
    }
    
    this.http.get<{data: UserHealth}>(`${this.apiUrl}api/v1/user/health/${user.id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error al obtener los datos de salud del usuario:', error);
          return of(null);
        })
      )
      .subscribe(healthData => {
        this.userHealthSubject.next(healthData);
        
        if (healthData) {
          this.userService.updateUserWithHealthData(healthData);
        }
      });
  }
  saveVaccinations(data: {user_id: number, vaccinations: Vaccine[]}): Observable<any> {
    return this.http.post(`${this.apiUrl}api/v1/user/health/vaccinations/create`, data)
      .pipe(
        tap(() => this.getUserHealthData()),
        catchError(error => {
          console.error('Error al guardar vacunas:', error);
          return of(null);
        })
      );
  }

  saveMedicalAndFamilyHistory(data: { medicalHistory: MedicalBackground[], familyHistory: FamilyBackground[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}api/v1/user/health/history/create`, data)
      .pipe(
        tap(() => this.getUserHealthData()),
        catchError(error => {
          console.error('Error al guardar antecedentes médicos:', error);
          return of(null);
        })
      );
  }  

  saveHealthData(data: { diseases: Condition[], disabilities: Allergy[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}api/v1/user/health/health-data/create`, data)
      .pipe(
        tap(() => this.getUserHealthData()),
        catchError(error => {
          console.error('Error al guardar datos de salud:', error);
          return of(null);
        })
      );
  }
  
  saveAllergiesAndMedications(data: { allergies: Allergy[], medications: Medication[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}api/v1/user/health/allergies-medications/create`, data)
      .pipe(
        tap(() => this.getUserHealthData()),
        catchError(error => {
          console.error('Error al guardar alergias y medicamentos:', error);
          return of(null);
        })
      );
  }
}