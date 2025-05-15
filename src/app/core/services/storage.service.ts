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

  private async setItemAsync(key: string, value: any): Promise<any> {
    try {
      // Primero intentamos usar IndexedDB
      await this.setInIndexedDB(key, value);
      this.storageChange.next({key, value});
      return value;
    } catch (error) {
      console.warn(`Error storing in IndexedDB, trying to reduce data size:`, error);
      
      // Si falla, intentamos reducir el tamaño de los datos
      let reducedValue = this.reduceDataSize(value);
      
      try {
        // Intentamos guardar la versión reducida en IndexedDB
        await this.setInIndexedDB(key, reducedValue);
        this.storageChange.next({key, value: reducedValue});
        return reducedValue;
      } catch (secError) {
        console.error(`Failed to store even reduced data in IndexedDB:`, secError);
        
        // Como último recurso, intentamos localStorage, pero solo con datos mínimos
        try {
          const minimalData = this.extractMinimalData(value);
          localStorage.setItem(key, JSON.stringify(minimalData));
          this.storageChange.next({key, value: minimalData});
          return minimalData;
        } catch (lsError) {
          console.error(`All storage methods failed:`, lsError);
          throw new Error('Storage quota exceeded in all available methods');
        }
      }
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
        console.warn(`Error retrieving from IndexedDB, fallback to localStorage:`, error);
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

  // Métodos auxiliares para reducir el tamaño de los datos
  
  private reduceDataSize(data: any): any {
    if (!data) return data;
    
    // Si es un array, procesamos cada elemento
    if (Array.isArray(data)) {
      return data.map(item => this.reduceDataSize(item));
    }
    
    // Si es un objeto, procesamos cada propiedad
    if (typeof data === 'object') {
      const result: any = {};
      
      for (const key in data) {
        // Eliminamos campos grandes conocidos
        if (key === 'imagebs64' || key.includes('Base64') || key.includes('b64')) {
          continue; // Omitir estos campos
        }
        
        // Procesamos recursivamente otros campos
        result[key] = this.reduceDataSize(data[key]);
      }
      
      return result;
    }
    
    // Devolvemos tipos primitivos sin cambios
    return data;
  }
  
  private extractMinimalData(data: any): any {
    if (!data) return null;
    
    // Si es un usuario, extraemos solo campos esenciales
    if (data.id && (data.email || data.name)) {
      return {
        id: data.id,
        email: data.email || '',
        name: data.name || '',
        lastname: data.lastname || '',
        verificado: data.verificado || false,
        role: data.role || 'User'
      };
    }
    
    // Si es un array de beneficiarios, extraemos solo ID y nombres
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item.id) {
          return {
            id: item.id,
            name: item.name || '',
            lastname: item.lastname || ''
          };
        }
        return item;
      });
    }
    
    return data;
  }
}