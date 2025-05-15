import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, switchMap, finalize, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { CacheService } from './cache-service';
import { ToastService } from './toast.service';
import { LoadingService } from './loading.service';

const apiUrl = environment.url;
const HEALTH_DATA_CACHE_KEY_PREFIX = 'health_data_';

@Injectable({ providedIn: 'root' })
export class HealthDataService {
  // Estado de carga
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Caché de datos de salud por ID de beneficiario
  private healthDataCache = new Map<number, any>();
  
  // Flag para rastrear solicitudes en progreso
  private pendingRequests = new Map<string, Observable<any>>();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private cacheService: CacheService,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {
    // Inicializar la caché desde el almacenamiento al arrancar
    this.initializeCache();
  }

  /**
   * Inicializa la caché desde el almacenamiento persistente
   */
  private initializeCache(): void {
    // Intentar cargar datos de salud previos desde almacenamiento
    this.storageService.getItem('health_data_keys').subscribe((keys: number[]) => {
      if (keys && Array.isArray(keys)) {
        // Para cada ID guardado, cargar sus datos de salud
        keys.forEach(id => {
          const cacheKey = `${HEALTH_DATA_CACHE_KEY_PREFIX}${id}`;
          this.storageService.getItem(cacheKey).subscribe(data => {
            if (data) {
              this.healthDataCache.set(id, data);
            }
          });
        });
      }
    });
  }

  /**
   * Obtiene los datos de salud de un beneficiario por su ID
   * Primero intenta obtener de caché, luego del servidor
   * @param id ID del beneficiario
   * @param forceRefresh Si es verdadero, fuerza una consulta al servidor aunque haya datos en caché
   * @param showLoading Si es verdadero, muestra indicador de carga
   */
  getHealthData(id: number, forceRefresh: boolean = false, showLoading: boolean = true): Observable<any> {
    // Generar key para el request en progreso
    const requestKey = `health_data_${id}`;
    
    // Si ya hay una solicitud en progreso para este ID, devolver esa
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }
    
    // Si tenemos datos en caché y no se fuerza recarga, devolverlos
    if (!forceRefresh && this.healthDataCache.has(id)) {
      return of(this.healthDataCache.get(id));
    }
    
    // Crear la solicitud al servidor
    const request = this.http.get<any>(`${apiUrl}api/patients/${id}/health-data`).pipe(
      tap(response => {
        // Si la respuesta es exitosa, guardar en caché
        if (response && response.success && response.data) {
          const healthData = response.data.health_data;
          
          // Almacenar en memoria
          this.healthDataCache.set(id, healthData);
          
          // Almacenar en caché persistente
          this.saveHealthDataToStorage(id, healthData);
        }
      }),
      map(response => {
        if (response && response.success && response.data) {
          return response.data.health_data;
        }
        return null;
      }),
      catchError(error => {
        // Si hay error, intentar obtener de caché como respaldo
        if (this.healthDataCache.has(id)) {
          console.warn(`Error al obtener datos de salud del servidor para ID ${id}, usando caché local`, error);
          return of(this.healthDataCache.get(id));
        }
        
        console.error(`Error al obtener datos de salud para ID ${id}:`, error);
        this.toastService.presentToast('Error al cargar datos de salud', 'danger');
        return throwError(() => error);
      }),
      finalize(() => {
        // Limpiar flags
        if (showLoading) {
          this.isLoadingSubject.next(false);
          this.loadingService.hideLoading();
        }
        this.pendingRequests.delete(requestKey);
      }),
      // Compartir la misma respuesta entre múltiples suscriptores
      shareReplay(1)
    );
    
    // Registrar la solicitud y devolverla
    this.pendingRequests.set(requestKey, request);
    return request;
  }

  /**
   * Guarda los datos de salud en almacenamiento persistente
   * @param id ID del beneficiario
   * @param healthData Datos de salud a guardar
   */
  private saveHealthDataToStorage(id: number, healthData: any): void {
    const cacheKey = `${HEALTH_DATA_CACHE_KEY_PREFIX}${id}`;
    
    // Guardar los datos
    this.storageService.setItem(cacheKey, healthData).subscribe(
      () => {
        // Actualizar también la lista de keys
        this.storageService.getItem('health_data_keys').subscribe((keys: number[]) => {
          const updatedKeys = [...(keys || [])];
          if (!updatedKeys.includes(id)) {
            updatedKeys.push(id);
            this.storageService.setItem('health_data_keys', updatedKeys).subscribe();
          }
        });
      },
      error => console.error(`Error al guardar datos de salud en almacenamiento para ID ${id}:`, error)
    );
  }

  /**
   * Actualiza manualmente la caché de datos de salud
   * @param id ID del beneficiario
   * @param healthData Datos de salud a guardar
   */
  updateHealthDataCache(id: number, healthData: any): void {
    // Validar estructura básica para evitar datos corruptos
    if (!healthData) return;
    
    // Asegurar estructura mínima
    const normalizedData = this.normalizeHealthData(healthData);
    
    // Guardar en memoria
    this.healthDataCache.set(id, normalizedData);
    
    // Guardar en almacenamiento
    this.saveHealthDataToStorage(id, normalizedData);
  }

  /**
   * Normaliza la estructura de datos de salud para garantizar consistencia
   * @param healthData Datos de salud a normalizar
   * @returns Datos normalizados
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
    
    const normalized = JSON.parse(JSON.stringify(healthData)); // Deep clone
    
    // Asegurar que vitals existe
    if (!normalized.vitals) {
      normalized.vitals = {
        heartRate: null,
        bloodPressure: null,
        bloodGlucose: null,
        bloodOxygen: null,
        respiratoryRate: null
      };
    }
    
    // Asegurar que medical_info existe
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
      // Asegurar que todos los arrays existen
      if (!normalized.medical_info.allergies) normalized.medical_info.allergies = [];
      if (!normalized.medical_info.diseases) normalized.medical_info.diseases = [];
      if (!normalized.medical_info.backgrounds) normalized.medical_info.backgrounds = [];
      if (!normalized.medical_info.familyBackgrounds) normalized.medical_info.familyBackgrounds = [];
      if (!normalized.medical_info.vaccines) normalized.medical_info.vaccines = [];
    }
    
    return normalized;
  }

  /**
   * Método para guardar la condición médica de un beneficiario
   * @param data Datos de condición médica 
   */
  saveHealthCondition(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Guardando condición médica...');
    
    return this.http.post<any>(`${apiUrl}api/medical-info/condition`, data).pipe(
      tap(response => {
        if (response && response.success && response.data && data.id_paciente) {
          // Actualizar la caché con los nuevos datos
          this.updateHealthDataInCache(data.id_paciente, 'condition', response.data);
        }
      }),
      catchError(error => {
        console.error('Error al guardar condición médica:', error);
        this.toastService.presentToast('Error al guardar condición médica', 'danger');
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
  }

  /**
   * Sincroniza las enfermedades de un beneficiario
   * @param data Datos con ID del paciente y lista de enfermedades 
   */
  syncDiseases(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Sincronizando enfermedades...');
    
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/diseases`, data).pipe(
      tap(response => {
        if (response && response.success && response.data && data.id_paciente) {
          // Actualizar la caché con los nuevos datos
          // Las respuestas de sync contienen: created, maintained y deleted
          // Usamos maintained como la lista completa actualizada
          if (response.data.maintained) {
            this.updateHealthDataInCache(data.id_paciente, 'diseases', response.data.maintained);
          }
        }
      }),
      catchError(error => {
        console.error('Error al sincronizar enfermedades:', error);
        this.toastService.presentToast('Error al sincronizar enfermedades', 'danger');
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
  }

  /**
   * Sincroniza las vacunas de un beneficiario
   * @param data Datos con ID del paciente y lista de vacunas 
   */
  syncVaccines(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Sincronizando vacunas...');
    
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/vaccines`, data).pipe(
      tap(response => {
        if (response && response.success && response.data && data.id_paciente) {
          if (response.data.maintained) {
            this.updateHealthDataInCache(data.id_paciente, 'vaccines', response.data.maintained);
          }
        }
      }),
      catchError(error => {
        console.error('Error al sincronizar vacunas:', error);
        this.toastService.presentToast('Error al sincronizar vacunas', 'danger');
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
  }

  /**
   * Sincroniza las alergias de un beneficiario
   * @param data Datos con ID del paciente y lista de alergias 
   */
  syncAllergies(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Sincronizando alergias...');
    
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/allergies`, data).pipe(
      tap(response => {
        if (response && response.success && response.data && data.id_paciente) {
          if (response.data.maintained) {
            this.updateHealthDataInCache(data.id_paciente, 'allergies', response.data.maintained);
          }
        }
      }),
      catchError(error => {
        console.error('Error al sincronizar alergias:', error);
        this.toastService.presentToast('Error al sincronizar alergias', 'danger');
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
  }

  /**
   * Sincroniza los antecedentes médicos de un beneficiario
   * @param data Datos con ID del paciente y lista de antecedentes 
   */
  syncBackgrounds(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Sincronizando antecedentes médicos...');
    
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/backgrounds`, data).pipe(
      tap(response => {
        if (response && response.success && response.data && data.id_paciente) {
          if (response.data.maintained) {
            this.updateHealthDataInCache(data.id_paciente, 'backgrounds', response.data.maintained);
          }
        }
      }),
      catchError(error => {
        console.error('Error al sincronizar antecedentes médicos:', error);
        this.toastService.presentToast('Error al sincronizar antecedentes médicos', 'danger');
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
  }

  /**
   * Sincroniza los antecedentes familiares de un beneficiario
   * @param data Datos con ID del paciente y lista de antecedentes familiares 
   */
  syncFamilyBackgrounds(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Sincronizando antecedentes familiares...');
    
    return this.http.post<any>(`${apiUrl}api/medical-info/sync/family-backgrounds`, data).pipe(
      tap(response => {
        if (response && response.success && response.data && data.id_paciente) {
          if (response.data.maintained) {
            this.updateHealthDataInCache(data.id_paciente, 'familyBackgrounds', response.data.maintained);
          }
        }
      }),
      catchError(error => {
        console.error('Error al sincronizar antecedentes familiares:', error);
        this.toastService.presentToast('Error al sincronizar antecedentes familiares', 'danger');
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
  }

  /**
   * Actualiza un campo específico en la caché de datos de salud
   * @param patientId ID del paciente
   * @param field Campo a actualizar (ej: 'diseases', 'allergies')
   * @param data Nuevos datos para ese campo
   */
  private updateHealthDataInCache(patientId: number, field: string, data: any): void {
    // Si no hay caché para este paciente, inicializamos la estructura
    if (!this.healthDataCache.has(patientId)) {
      this.getHealthData(patientId, true, false).subscribe();
      return;
    }
    
    // Obtener datos actuales
    const currentData = this.healthDataCache.get(patientId);
    
    // Deep clone para evitar mutaciones no deseadas
    const updatedData = JSON.parse(JSON.stringify(currentData));
    
    // Actualizar el campo correspondiente
    if (!updatedData.medical_info) {
      updatedData.medical_info = {};
    }
    
    // Actualizamos el campo específico
    updatedData.medical_info[field] = data;
    
    // Guardar datos actualizados
    this.updateHealthDataCache(patientId, updatedData);
  }

  /**
   * Combina datos de salud del servidor con datos en caché
   * Útil para tener información completa cuando el servidor retorna datos parciales
   * @param patientId ID del paciente
   * @param serverData Datos del servidor
   * @returns Datos combinados
   */
  mergeHealthData(patientId: number, serverData: any): any {
    // Si no hay datos del servidor, devolvemos caché
    if (!serverData) {
      return this.healthDataCache.get(patientId) || this.normalizeHealthData(null);
    }
    
    // Si no hay datos en caché, devolvemos servidor normalizado
    if (!this.healthDataCache.has(patientId)) {
      return this.normalizeHealthData(serverData);
    }
    
    // Obtener datos de caché
    const cachedData = this.healthDataCache.get(patientId);
    
    // Combinar datos (dar prioridad a datos del servidor pero complementar con caché)
    const mergedData = {
      vitals: { ...cachedData.vitals, ...serverData.vitals },
      medical_info: {
        allergies: serverData.medical_info?.allergies || cachedData.medical_info.allergies,
        diseases: serverData.medical_info?.diseases || cachedData.medical_info.diseases,
        condition: serverData.medical_info?.condition || cachedData.medical_info.condition,
        backgrounds: serverData.medical_info?.backgrounds || cachedData.medical_info.backgrounds,
        familyBackgrounds: serverData.medical_info?.familyBackgrounds || cachedData.medical_info.familyBackgrounds,
        vaccines: serverData.medical_info?.vaccines || cachedData.medical_info.vaccines,
      }
    };
    
    return mergedData;
  }

  /**
   * Limpia todos los datos de salud en caché para un paciente
   * @param patientId ID del paciente
   */
  clearHealthDataCache(patientId: number): void {
    // Eliminar de la caché en memoria
    this.healthDataCache.delete(patientId);
    
    // Eliminar del almacenamiento persistente
    const cacheKey = `${HEALTH_DATA_CACHE_KEY_PREFIX}${patientId}`;
    this.storageService.removeItem(cacheKey).subscribe(() => {
      // También actualizar la lista de keys
      this.storageService.getItem('health_data_keys').subscribe((keys: number[]) => {
        if (keys && Array.isArray(keys)) {
          const filteredKeys = keys.filter(id => id !== patientId);
          this.storageService.setItem('health_data_keys', filteredKeys).subscribe();
        }
      });
    });
  }

  /**
   * Expone métodos de depuración en la ventana para resolver problemas
   */
  exposeDebugMethods(): void {
    (window as any).healthDataDebug = {
      getCachedIds: () => Array.from(this.healthDataCache.keys()),
      getCachedData: (id: number) => this.healthDataCache.get(id),
      getAllCachedData: () => {
        const result: any = {};
        this.healthDataCache.forEach((value, key) => {
          result[key] = value;
        });
        return result;
      },
      clearCache: (id?: number) => {
        if (id) {
          this.clearHealthDataCache(id);
          return `Caché para ID ${id} eliminada`;
        } else {
          this.healthDataCache.clear();
          return 'Caché completa eliminada';
        }
      },
      forceRefresh: (id: number) => {
        this.getHealthData(id, true).subscribe(
          error => console.error(`Error actualizando datos para ID ${id}:`, error)
        );
        return 'Actualización iniciada';
      }
    };
  }
}