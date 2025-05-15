import { Injectable } from '@angular/core';
import { Beneficiary } from '../interfaces/beneficiary.interface';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { HealthDataService } from './healthData.service';

/**
 * Servicio para la integración entre beneficiarios y sus datos de salud
 * Este servicio actúa como mediador entre BeneficiaryService y HealthDataService
 */
@Injectable({ providedIn: 'root' })
export class BeneficiaryHealthIntegrationService {
  // Notifica si hay operaciones de sincronización de datos en curso
  private isSyncingSubject = new BehaviorSubject<boolean>(false);
  public isSyncing$ = this.isSyncingSubject.asObservable();

  constructor(
    private healthDataService: HealthDataService,
    private storageService: StorageService
  ) {}

  /**
   * Enriquece un beneficiario con datos de salud completos
   * @param beneficiary Beneficiario a enriquecer
   */
  enrichBeneficiary(beneficiary: Beneficiary): Observable<Beneficiary> {
    if (!beneficiary || !beneficiary.id) {
      return of(beneficiary);
    }

    // Si el beneficiario ya tiene datos de salud completos, devolvemos directamente
    if (
      beneficiary.health_data &&
      beneficiary.health_data.vitals &&
      beneficiary.health_data.medical_info
    ) {
      return of(beneficiary);
    }

    // Marcar que estamos sincronizando
    this.isSyncingSubject.next(true);

    // Obtener datos de salud más recientes
    return new Observable<Beneficiary>(observer => {
      this.healthDataService.getHealthData(beneficiary.id, false, false).subscribe(
        (healthData: any) => {
          if (healthData) {
            // Crear una copia del beneficiario para no mutar el original
            const enrichedBeneficiary = { ...beneficiary, health_data: healthData };
            observer.next(enrichedBeneficiary);
          } else {
            // Si no hay datos, devolver el beneficiario original
            observer.next(beneficiary);
          }
          observer.complete();
          this.isSyncingSubject.next(false);
        },
        (error: any) => {
          console.error('Error al enriquecer beneficiario con datos de salud:', error);
          observer.next(beneficiary);
          observer.complete();
          this.isSyncingSubject.next(false);
        }
      );
    });
  }

  /**
   * Enriquece una lista de beneficiarios con datos de salud
   * @param beneficiaries Lista de beneficiarios a enriquecer
   */
  enrichBeneficiaries(beneficiaries: Beneficiary[]): Observable<Beneficiary[]> {
    if (!beneficiaries || !Array.isArray(beneficiaries) || beneficiaries.length === 0) {
      return of(beneficiaries || []);
    }

    // Marcar que estamos sincronizando
    this.isSyncingSubject.next(true);

    return new Observable<Beneficiary[]>(observer => {
      // Hacemos una copia para no mutar el original
      const enrichedBeneficiaries = [...beneficiaries];
      let pendingCount = beneficiaries.length;

      // Para cada beneficiario, intentamos enriquecerlo
      beneficiaries.forEach((beneficiary, index) => {
        if (!beneficiary.id) {
          pendingCount--;
          if (pendingCount === 0) {
            observer.next(enrichedBeneficiaries);
            observer.complete();
            this.isSyncingSubject.next(false);
          }
          return;
        }

        this.healthDataService.getHealthData(beneficiary.id, false, false).subscribe(
          (healthData: any) => {
            if (healthData) {
              enrichedBeneficiaries[index] = { ...beneficiary, health_data: healthData };
            }
            
            pendingCount--;
            if (pendingCount === 0) {
              observer.next(enrichedBeneficiaries);
              observer.complete();
              this.isSyncingSubject.next(false);
            }
          },
          (error: any) => {
            console.error(`Error al obtener datos de salud para beneficiario ${beneficiary.id}:`, error);
            pendingCount--;
            if (pendingCount === 0) {
              observer.next(enrichedBeneficiaries);
              observer.complete();
              this.isSyncingSubject.next(false);
            }
          }
        );
      });
    });
  }

  /**
   * Asegura que un beneficiario tenga una estructura de datos de salud válida
   * @param beneficiary Beneficiario a normalizar
   */
  ensureHealthDataStructure(beneficiary: Beneficiary): Beneficiary {
    if (!beneficiary) return beneficiary;
    
    // Clonamos para no mutar el original
    const normalizedBeneficiary = { ...beneficiary };
    
    // Si no hay datos de salud, creamos la estructura básica
    if (!normalizedBeneficiary.health_data) {
      normalizedBeneficiary.health_data = {
        vitals: {
          heartRate: null,
          bloodPressure: null,
          bloodGlucose: null,
          bloodOxygen: null,
          respiratoryRate: null
        },
        medical_info: {
          allergies: [],
          diseases: [],
          condition: null,
          backgrounds: [],
          familyBackgrounds: [],
          vaccines: []
        }
      };
      return normalizedBeneficiary;
    }
    
    // Si hay datos pero no están completos, completamos la estructura
    const healthData = normalizedBeneficiary.health_data;
    
    // Aseguramos que exista vitals
    if (!healthData.vitals) {
      healthData.vitals = {
        heartRate: null,
        bloodPressure: null,
        bloodGlucose: null,
        bloodOxygen: null,
        respiratoryRate: null
      };
    }
    
    // Aseguramos que exista medical_info
    if (!healthData.medical_info) {
      healthData.medical_info = {
        allergies: [],
        diseases: [],
        condition: null,
        backgrounds: [],
        familyBackgrounds: [],
        vaccines: []
      };
    } else {
      // Aseguramos que existan todos los arrays
      const medicalInfo = healthData.medical_info;
      if (!medicalInfo.allergies) medicalInfo.allergies = [];
      if (!medicalInfo.diseases) medicalInfo.diseases = [];
      if (!medicalInfo.backgrounds) medicalInfo.backgrounds = [];
      if (!medicalInfo.familyBackgrounds) medicalInfo.familyBackgrounds = [];
      if (!medicalInfo.vaccines) medicalInfo.vaccines = [];
    }
    
    return normalizedBeneficiary;
  }

  /**
   * Sincroniza los datos de salud entre el servidor y la caché local
   * @param beneficiaryId ID del beneficiario
   */
  syncHealthData(beneficiaryId: number): Observable<any> {
    // Marcar que estamos sincronizando
    this.isSyncingSubject.next(true);

    return new Observable(observer => {
      this.healthDataService.getHealthData(beneficiaryId, true).subscribe(
        healthData => {
          observer.next(healthData);
          observer.complete();
          this.isSyncingSubject.next(false);
        },
        error => {
          console.error(`Error al sincronizar datos de salud para beneficiario ${beneficiaryId}:`, error);
          observer.error(error);
          this.isSyncingSubject.next(false);
        }
      );
    });
  }

  /**
   * Recupera los datos de salud desde una fuente de respaldo
   * @param beneficiaryId ID del beneficiario
   */
  recoverHealthData(beneficiaryId: number): Observable<any> {
    // Clave para buscar en almacenamiento persistente
    const storageKey = `health_data_${beneficiaryId}`;

    return new Observable(observer => {
      this.storageService.getItem(storageKey).subscribe(
        data => {
          if (data) {
            // Si encontramos datos en almacenamiento, actualizar la caché
            this.healthDataService.updateHealthDataCache(beneficiaryId, data);
            observer.next(data);
          } else {
            observer.next(null);
          }
          observer.complete();
        },
        error => {
          console.error(`Error al recuperar datos de salud para beneficiario ${beneficiaryId}:`, error);
          observer.error(error);
        }
      );
    });
  }
}