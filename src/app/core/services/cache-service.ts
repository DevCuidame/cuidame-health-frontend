import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

/**
 * Servicio de caché híbrido que utiliza memoria para datos temporales
 * y StorageService para datos que necesitan persistencia
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private memoryCache: Map<string, any> = new Map();
  private cacheChanges = new BehaviorSubject<{key: string, value: any}>({key: '', value: null});
  public cacheChanges$ = this.cacheChanges.asObservable();

  constructor(private storageService: StorageService) {
    // Escuchar cambios en el almacenamiento persistente
    this.storageService.storageChange$.subscribe(change => {
      // Si hay un cambio en el almacenamiento, actualizar también la caché en memoria
      if (change.key && change.key !== 'all') {
        if (change.value === null) {
          this.removeFromMemory(change.key);
        } else {
          this.setInMemory(change.key, change.value);
        }
      } else if (change.key === 'all' && change.value === null) {
        // Si se limpió todo el almacenamiento, limpiar también la caché
        this.clearMemoryCache();
      }
    });
  }

  /**
   * Almacena un valor en la caché de memoria
   * @param key Clave del valor
   * @param value Valor a almacenar
   * @param expirationMinutes Tiempo de expiración en minutos (solo para caché en memoria)
   */
  setInMemory(key: string, value: any, expirationMinutes: number = 30): void {
    const expirationMs = expirationMinutes * 60 * 1000;
    const expiration = Date.now() + expirationMs;
    
    this.memoryCache.set(key, {
      value,
      expiration
    });
    
    this.cacheChanges.next({key, value});
  }

  /**
   * Obtiene un valor de la caché de memoria
   * @param key Clave del valor
   * @returns El valor almacenado o null si no existe o ha expirado
   */
  getFromMemory(key: string): any {
    if (!this.memoryCache.has(key)) {
      return null;
    }
    
    const cachedItem = this.memoryCache.get(key);
    
    // Verificar si el ítem ha expirado
    if (cachedItem.expiration < Date.now()) {
      this.memoryCache.delete(key);
      this.cacheChanges.next({key, value: null});
      return null;
    }
    
    return cachedItem.value;
  }

  /**
   * Obtiene un valor, primero de memoria y luego de almacenamiento si no está en memoria
   * @param key Clave del valor
   * @returns Observable con el valor
   */
  get(key: string): Observable<any> {
    // Primero intentar obtener de memoria
    const memoryValue = this.getFromMemory(key);
    if (memoryValue !== null) {
      return of(memoryValue);
    }
    
    // Si no está en memoria, obtener del almacenamiento
    return this.storageService.getItem(key).pipe(
      tap(value => {
        // Si se encuentra en almacenamiento, guardar en memoria también
        if (value !== null) {
          this.setInMemory(key, value);
        }
      })
    );
  }

  /**
   * Almacena un valor tanto en memoria como en almacenamiento persistente
   * @param key Clave del valor
   * @param value Valor a almacenar
   * @param persistToStorage Si se debe almacenar también en almacenamiento persistente
   * @returns Observable con el resultado
   */
  set(key: string, value: any, persistToStorage: boolean = true): Observable<any> {
    // Almacenar en memoria
    this.setInMemory(key, value);
    
    // Si se pide persistencia, almacenar también en storage
    if (persistToStorage) {
      return this.storageService.setItem(key, value);
    }
    
    return of(value);
  }

  /**
   * Elimina un valor tanto de memoria como de almacenamiento
   * @param key Clave del valor a eliminar
   * @returns Observable que completa cuando se elimina
   */
  remove(key: string): Observable<void> {
    this.removeFromMemory(key);
    return this.storageService.removeItem(key);
  }

  /**
   * Limpia toda la caché, tanto en memoria como en almacenamiento
   * @returns Observable que completa cuando la limpieza termina
   */
  clear(): Observable<void> {
    this.clearMemoryCache();
    return this.storageService.clear();
  }

  /**
   * Elimina un valor solo de la caché en memoria
   * @param key Clave del valor
   */
  removeFromMemory(key: string): void {
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key);
      this.cacheChanges.next({key, value: null});
    }
  }

  /**
   * Limpia solo la caché en memoria
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
    this.cacheChanges.next({key: 'all', value: null});
  }

  /**
   * Verifica si un elemento está en la caché de memoria
   * @param key Clave a verificar
   * @returns True si existe y no ha expirado
   */
  hasInMemory(key: string): boolean {
    return this.getFromMemory(key) !== null;
  }

  /**
   * Verifica si existe en algún almacenamiento
   * @param key Clave a verificar
   * @returns Observable con true/false
   */
  has(key: string): Observable<boolean> {
    // Primero verificar en memoria
    if (this.hasInMemory(key)) {
      return of(true);
    }
    
    // Si no está en memoria, verificar en almacenamiento
    return this.storageService.getItem(key).pipe(
      map(value => value !== null),
      catchError(() => of(false))
    );
  }

  /**
   * Actualiza un elemento en la caché si ya existe
   * @param key Clave del elemento
   * @param updater Función que recibe el valor actual y retorna el nuevo
   * @param persistToStorage Si debe persistirse
   * @returns Observable con el valor actualizado
   */
  update(key: string, updater: (currentValue: any) => any, persistToStorage: boolean = true): Observable<any> {
    return this.get(key).pipe(
      map(currentValue => updater(currentValue)),
      switchMap(newValue => this.set(key, newValue, persistToStorage))
    );
  }
}