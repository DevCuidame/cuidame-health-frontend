// Clase de servicio para almacenamiento
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private dbName = 'appStorage';
  private dbVersion = 1;
  private storeName = 'userData';
  
  // Sujeto para notificar cambios en el almacenamiento
  private storageChange = new BehaviorSubject<{key: string, value: any}>({key: '', value: null});
  public storageChange$ = this.storageChange.asObservable();

  constructor() {
    this.initDB().catch(error => console.error('Error inicializando IndexedDB:', error));
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        reject('Error opening IndexedDB');
      };
      
      request.onsuccess = (event) => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  public setItem(key: string, value: any): Observable<any> {
    return from(this.setItemAsync(key, value));
  }

  private async setItemAsync(key: string, value: any, attempt = 1): Promise<any> {
    try {
      // 1. Primero intentar guardar
      await this.setInIndexedDB(key, value);
      
      // 2. Verificar que se guardó correctamente
      const verification = await this.verifyStoredData(key, value);
      if (!verification && attempt < 3) {
        console.warn(`Storage verification failed, retrying (attempt ${attempt + 1})`);
        return this.setItemAsync(key, value, attempt + 1);
      }
      if (!verification) {
        throw new Error('Data verification failed after multiple attempts');
      }
      
      // this.storageChange.next({key, value});
      return value;
    } catch (error) {
      console.warn(`Error storing in IndexedDB (attempt ${attempt}):`, error);
      
      if (attempt >= 3) {
        throw error; // Lanzar error después de 3 intentos
      }
      
      // Esperar un poco antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 300 * attempt));
      return this.setItemAsync(key, value, attempt + 1);
    }
  }

  private async setInIndexedDB(key: string, value: any): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public getItem(key: string): Observable<any> {
    return from(this.getItemAsync(key)).pipe(
      catchError(error => {
        try {
          const value = localStorage.getItem(key);
          return of(value ? JSON.parse(value) : null);
        } catch (e) {
          return of(null);
        }
      })
    );
  }

  private async getItemAsync(key: string): Promise<any> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  public removeItem(key: string): Observable<void> {
    return from(this.removeItemAsync(key)).pipe(
      catchError(error => {
        console.warn(`Error removing from IndexedDB, fallback to localStorage:`, error);
        localStorage.removeItem(key);
        this.storageChange.next({key, value: null});
        return of(undefined);
      })
    );
  }

  private async removeItemAsync(key: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(key);
      
      request.onsuccess = () => {
        this.storageChange.next({key, value: null});
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  public clear(): Observable<void> {
    return from(this.clearAsync()).pipe(
      catchError(error => {
        console.warn(`Error clearing IndexedDB, fallback to localStorage:`, error);
        localStorage.clear();
        this.storageChange.next({key: 'all', value: null});
        return of(undefined);
      })
    );
  }

  async clearBeforeSave(key: string, newData: any): Promise<any> {
    await this.removeItemAsync(key);
    return this.setItemAsync(key, newData);
  }

  public async logStorageUsage(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const {usage, quota} = await navigator.storage.estimate();
    }
  }

  private async clearAsync(): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        this.storageChange.next({key: 'all', value: null});
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private reduceDataSize(data: any): any {
    if (!data) return data;
  
    // Si es un array, procesar cada elemento
    if (Array.isArray(data)) {
      return data.map(item => this.reduceDataSize(item));
    }
  
    // Si es un objeto, procesar cada propiedad
    if (typeof data === 'object' && !(data instanceof Date)) {
      const result: any = {};
      
      // Lista de campos que DEBEN preservarse exactamente como están
      const preservedFields = [
        'health_data', 'medical_info', 'vitals', 
        'department_name', 'ciudad', 'city_id',
        'departamento', 'fecha_nacimiento', 'photourl', 'imagebs64',
      ];
  
      for (const key in data) {
        // Preservar campos importantes
        if (preservedFields.includes(key)) {
          result[key] = data[key];
        }
        // Eliminar solo campos de imágenes grandes
        // else if (key === 'imagebs64' || key.includes('Base64')) {
        //   continue;
        // }
        // Procesar recursivamente otros campos
        else {
          result[key] = this.reduceDataSize(data[key]);
        }
      }
      
      return result;
    }
    
    // Devolver tipos primitivos sin cambios
    return data;
  }

// Modificar el método extractMinimalData en StorageService
private extractMinimalData(data: any): any {
  if (!data) return null;
  
  // Para array de beneficiarios
  if (Array.isArray(data)) {
    return data.map(item => {
      if (item.id) {
        return {
          id: item.id,
          nombre: item.nombre || '',
          apellido: item.apellido || '',
          genero: item.genero || '',
          fecha_nacimiento: item.fecha_nacimiento || null,
          tipoid: item.tipoid || '',
          numeroid: item.numeroid || '',
          code: item.code || '',
          // Campos de ubicación
          ...(item.city_id ? { city_id: item.city_id } : {}),
          ...(item.departamento ? { departamento: item.departamento } : {}),
          ...(item.ciudad ? { ciudad: item.ciudad } : {}),
          ...(item.department_name ? { department_name: item.department_name } : {}),
          // Health data
          ...(item.health_data ? { health_data: item.health_data } : {})
        };
      }
      return item;
    });
  }
  
  return data;
}

private async checkStorageQuota(): Promise<boolean> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return (quota! - usage!) > 5000000; // 5MB mínimo disponible
    } catch (error) {
      return true; // Asumir que hay espacio si no se puede verificar
    }
  }
  return true; // Navegadores sin soporte
}

// StorageService
private async verifyStoredData(key: string, originalData: any): Promise<boolean> {
  try {
    const storedData = await this.getItemAsync(key);

    if (Array.isArray(originalData) && Array.isArray(storedData)) {
      if (originalData.length !== storedData.length) {
        console.error('[Verify] Data length mismatch.');
        return false;
      }

      for (let i = 0; i < originalData.length; i++) {
        const original = originalData[i];
        const stored = storedData[i];

        if (original.id !== stored.id) { console.error(`[Verify ID ${original.id}] ID mismatch: ${original.id} vs ${stored.id}`); return false; }
        if (original.nombre !== stored.nombre) { console.error(`[Verify ID ${original.id}] Nombre mismatch: ${original.nombre} vs ${stored.nombre}`); return false; }

        // <<< VERIFICACIONES IMPORTANTES AÑADIDAS >>>
        if (original.ciudad !== stored.ciudad) { 
          console.error(`[Verify ID <span class="math-inline">\{original\.id\}\] Ciudad mismatch\: Original\='</span>{original.ciudad}', Stored='${stored.ciudad}'`); 
          // return false; // Podrías habilitar esto después de más pruebas
        }
        if (original.department_name !== stored.department_name) { 
          console.error(`[Verify ID <span class="math-inline">\{original\.id\}\] Department\_name mismatch\: Original\='</span>{original.department_name}', Stored='${stored.department_name}'`); 
          // return false; 
        }
        if (('imagebs64' in original) !== ('imagebs64' in stored)) {
            console.warn(`[Verify ID ${original.id}] Presence of imagebs64 mismatch. Original has: ${'imagebs64' in original}, Stored has: ${'imagebs64' in stored}`);
        }
        // <<< FIN VERIFICACIONES AÑADIDAS >>>

        if (original.health_data && !stored.health_data) {
          console.error(`[Verify ID ${original.id}] Health data missing in stored beneficiary`, stored);
          return false;
        }
        // Podrías añadir una comparación más profunda de health_data si es necesario
        // if (JSON.stringify(original.health_data) !== JSON.stringify(stored.health_data)) { ... }
      }
    } else if (JSON.stringify(originalData) !== JSON.stringify(storedData)) {
        // Para casos donde no es un array
        console.error('[Verify] Non-array data mismatch.');
        // return false;
    }

    return true;
  } catch (error) {
    console.error('[Verify] Verification getItemAsync failed:', error);
    return false;
  }
}
}