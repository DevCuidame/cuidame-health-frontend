import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Beneficiary } from '../interfaces/beneficiary.interface';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class SecureHealthDataService {
  // Storage keys
  private readonly BENEFICIARIES_KEY = 'beneficiaries';
  private readonly ACTIVE_BENEFICIARY_KEY = 'activeBeneficiary';
  
  // Memory cache for critical health data structures
  private healthDataCache = new Map<number, any>();
  
  // Track data integrity
  private healthDataIntegritySubject = new BehaviorSubject<boolean>(true);
  public healthDataIntegrity$ = this.healthDataIntegritySubject.asObservable();

  constructor(private storageService: StorageService) {
    // Initialize cache
    this.initializeCache();
    
    // Register global helper method for debugging/recovery
    this.registerGlobalHelpers();
  }

  private initializeCache(): void {
    // Load beneficiaries data into cache
    this.storageService.getItem(this.BENEFICIARIES_KEY).subscribe(
      (beneficiaries: Beneficiary[]) => {
        if (beneficiaries && Array.isArray(beneficiaries)) {
          beneficiaries.forEach(beneficiary => {
            if (beneficiary.id && beneficiary.health_data) {
              this.healthDataCache.set(
                beneficiary.id, 
                this.deepClone(beneficiary.health_data)
              );
            }
          });
        }
      }
    );
    
    // Also check active beneficiary
    this.storageService.getItem(this.ACTIVE_BENEFICIARY_KEY).subscribe(
      (beneficiary: Beneficiary) => {
        if (beneficiary?.id && beneficiary?.health_data) {
          this.healthDataCache.set(
            beneficiary.id, 
            this.deepClone(beneficiary.health_data)
          );
        }
      }
    );
  }

  /**
   * Updates health data cache for a specific beneficiary
   */
  updateHealthData(beneficiaryId: number, healthData: any): void {
    // Validate structure before caching
    const normalizedData = this.normalizeHealthData(healthData);
    this.healthDataCache.set(beneficiaryId, this.deepClone(normalizedData));
  }

  /**
   * Gets health data from cache by beneficiary ID
   */
  getHealthData(beneficiaryId: number): any {
    if (this.healthDataCache.has(beneficiaryId)) {
      return this.deepClone(this.healthDataCache.get(beneficiaryId));
    }
    return null;
  }

  /**
   * Updates a beneficiary ensuring health data integrity
   */
  enrichBeneficiary(beneficiary: Beneficiary): Beneficiary {
    if (!beneficiary || !beneficiary.id) return beneficiary;
    
    // First try to get health data from cache
    const cachedHealthData = this.getHealthData(beneficiary.id);
    
    if (cachedHealthData) {
      // Create a new object to avoid reference issues
      const enriched = this.deepClone(beneficiary);
      
      // Either merge or replace health data
      if (!enriched.health_data) {
        enriched.health_data = cachedHealthData;
      } else {
        // Careful merging - prioritize cached medical_info if the current one is missing
        if (!enriched.health_data.medical_info && cachedHealthData.medical_info) {
          enriched.health_data.medical_info = cachedHealthData.medical_info;
        }
        
        // Ensure vitals structure
        if (!enriched.health_data.vitals && cachedHealthData.vitals) {
          enriched.health_data.vitals = cachedHealthData.vitals;
        }
      }
      
      return enriched;
    }
    
    // If no cached data, ensure the beneficiary has the standard structure
    return this.ensureHealthDataStructure(beneficiary);
  }

  /**
   * Updates a list of beneficiaries ensuring health data integrity for each
   */
  enrichBeneficiaries(beneficiaries: Beneficiary[]): Beneficiary[] {
    if (!beneficiaries || !Array.isArray(beneficiaries)) return [];
    
    return beneficiaries.map(beneficiary => this.enrichBeneficiary(beneficiary));
  }

  /**
   * Ensures a beneficiary has the complete health data structure
   */
  ensureHealthDataStructure(beneficiary: Beneficiary): Beneficiary {
    if (!beneficiary) return beneficiary;
    
    // Clone to avoid mutation
    const result = this.deepClone(beneficiary);
    
    // Create health_data if missing
    if (!result.health_data) {
      result.health_data = {
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
    } else {
      // Ensure vitals exists
      if (!result.health_data.vitals) {
        result.health_data.vitals = {
          heartRate: null,
          bloodPressure: null,
          bloodGlucose: null,
          bloodOxygen: null,
          respiratoryRate: null
        };
      }
      
      // Ensure medical_info exists
      if (!result.health_data.medical_info) {
        result.health_data.medical_info = {
          allergies: [],
          diseases: [],
          condition: null,
          backgrounds: [],
          familyBackgrounds: [],
          vaccines: []
        };
      } else {
        // Ensure all arrays exist
        if (!result.health_data.medical_info.allergies) result.health_data.medical_info.allergies = [];
        if (!result.health_data.medical_info.diseases) result.health_data.medical_info.diseases = [];
        if (!result.health_data.medical_info.backgrounds) result.health_data.medical_info.backgrounds = [];
        if (!result.health_data.medical_info.familyBackgrounds) result.health_data.medical_info.familyBackgrounds = [];
        if (!result.health_data.medical_info.vaccines) result.health_data.medical_info.vaccines = [];
      }
    }
    
    return result;
  }

  /**
   * Normalizes health data to ensure consistent structure
   */
  private normalizeHealthData(healthData: any): any {
    if (!healthData) {
      return {
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
    }
    
    const normalized = this.deepClone(healthData);
    
    // Ensure vitals exists
    if (!normalized.vitals) {
      normalized.vitals = {
        heartRate: null,
        bloodPressure: null,
        bloodGlucose: null,
        bloodOxygen: null,
        respiratoryRate: null
      };
    }
    
    // Ensure medical_info exists
    if (!normalized.medical_info) {
      normalized.medical_info = {
        allergies: [],
        diseases: [],
        condition: null,
        backgrounds: [],
        familyBackgrounds: [],
        vaccines: []
      };
    } else {
      // Ensure all arrays exist
      if (!normalized.medical_info.allergies) normalized.medical_info.allergies = [];
      if (!normalized.medical_info.diseases) normalized.medical_info.diseases = [];
      if (!normalized.medical_info.backgrounds) normalized.medical_info.backgrounds = [];
      if (!normalized.medical_info.familyBackgrounds) normalized.medical_info.familyBackgrounds = [];
      if (!normalized.medical_info.vaccines) normalized.medical_info.vaccines = [];
    }
    
    return normalized;
  }

  /**
   * Creates a deep clone to avoid reference issues
   */
  private deepClone<T>(obj: T): T {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Registers global helper methods for debugging
   */
  private registerGlobalHelpers(): void {
    (window as any).healthDataDebug = {
      getCacheKeys: () => Array.from(this.healthDataCache.keys()),
      getCacheSize: () => this.healthDataCache.size,
      getCachedData: (id: number) => this.deepClone(this.healthDataCache.get(id)),
      fixHealthData: (beneficiary: any) => {
        if (beneficiary?.id) {
          const cached = this.getHealthData(beneficiary.id);
          if (cached) {
            const fixed = { ...beneficiary, health_data: cached };
            return fixed;
          }
        }
        return "No cached data found for this beneficiary";
      }
    };
  }
}