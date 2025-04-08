import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserHealthService } from './user-health.service';
import { Allergy, Condition, FamilyBackground, MedicalBackground, Medication, Vaccine } from '../interfaces/beneficiary.interface';

const apiUrl = environment.url;

@Injectable({ providedIn: 'root' })
export class HealthDataService {
  constructor(private http: HttpClient, private userHealthService?: UserHealthService) {}

  saveVaccinations(vaccinations: Vaccine[]): Observable<any> {
    return this.http.post(`${apiUrl}api/v1/beneficiary/vaccinations/create`, { vaccinations });
  }

  saveMedicalAndFamilyHistory(data: { medicalHistory: MedicalBackground[], familyHistory: FamilyBackground[] }): Observable<any> {
    return this.http.post(`${apiUrl}api/v1/beneficiary/history/create`, data);
  }  

  saveHealthData(data: { diseases: Condition[], disabilities: Allergy[] }): Observable<any> {
    return this.http.post(`${apiUrl}api/v1/beneficiary/health-data/create`, data);
  }

  // Método para sincronizar condiciones médicas (objeto único, no array)
  saveHealthCondition(data: any): Observable<any> {
    return this.http.post<any>(`${apiUrl}api/medical-info/condition`, data);
  }
  
  saveAllergiesAndMedications(data: { allergies: Allergy[]}): Observable<any> {
    return this.http.post(`${apiUrl}api/v1/beneficiary/allergies-medications/create`, data);
  }

  // Método para sincronizar enfermedades
  syncDiseases(data: any): Observable<any> {
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/diseases`, data);
  }

  // Método para sincronizar vacunas
  syncVaccines(data: any): Observable<any> {
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/vaccines`, data);
  }

  // Método para sincronizar alergias
  syncAllergies(data: any): Observable<any> {
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/allergies`, data);
  }

  // Método para sincronizar antecedentes médicos
  syncBackgrounds(data: any): Observable<any> {
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/backgrounds`, data);
  }

  // Método para sincronizar antecedentes familiares
  syncFamilyBackgrounds(data: any): Observable<any> {
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/family-backgrounds`, data);
  }

  getUserHealthData() {
    if (this.userHealthService) {
      this.userHealthService.getUserHealthData();
    } else if ((window as any).Injector) {
      try {
        const healthService = (window as any).Injector.get(UserHealthService);
        healthService.getUserHealthData();
      } catch (error) {
        console.error('Error getting UserHealthService:', error);
      }
    }
  }
}