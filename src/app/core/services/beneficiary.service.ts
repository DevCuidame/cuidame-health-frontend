import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError, tap } from 'rxjs';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { environment } from 'src/environments/environment';
import { UserService } from '../../modules/auth/services/user.service';

const apiUrl = environment.url;

@Injectable({ providedIn: 'root' })
export class BeneficiaryService {
  private beneficiariesSubject = new BehaviorSubject<Beneficiary[]>([]);
  public beneficiaries$ = this.beneficiariesSubject.asObservable();

  private beneficiaryCountSubject = new BehaviorSubject<number>(0);
  public beneficiaryCount$ = this.beneficiaryCountSubject.asObservable();

  public maxBeneficiariesSubject = new BehaviorSubject<number>(5);
  public maxBeneficiaries$ = this.maxBeneficiariesSubject.asObservable();

  // Active beneficiary subject
  private activeBeneficiarySubject = new BehaviorSubject<Beneficiary | null>(this.loadActiveBeneficiary());
  public activeBeneficiary$ = this.activeBeneficiarySubject.asObservable();

  constructor(private http: HttpClient, private userService: UserService) {
    // Cargar beneficiarios del localStorage al iniciar el servicio
    this.loadBeneficiariesFromStorage();
  }

  // Método para cargar beneficiarios del localStorage
  private loadBeneficiariesFromStorage(): void {
    const storedBeneficiaries = localStorage.getItem('beneficiaries');
    if (storedBeneficiaries) {
      try {
        const beneficiaries = JSON.parse(storedBeneficiaries);
        this.beneficiariesSubject.next(beneficiaries);
        this.updateBeneficiaryCount(beneficiaries.length);
      } catch (error) {
        console.error('Error al cargar beneficiarios del localStorage:', error);
        localStorage.removeItem('beneficiaries'); // Eliminar datos corruptos
      }
    }
  }

  addBeneficiary(data: Beneficiary): Observable<any> {
    const user = this.userService.getUser();

    if (!user || !user.id) {
      return throwError(() => new Error('Usuario no autenticado.'));
    }

    const beneficiary = {
      ...data,
      a_cargo_id: user.id,
    };

    return this.http
      .post(`${apiUrl}api/patients`, beneficiary)
      .pipe(
        map((response: any) => {
          if (response.statusCode === 200 && response.data) {
            const currentBeneficiaries = this.beneficiariesSubject.value;

            const updatedBeneficiaries = [
              ...currentBeneficiaries,
              response.data,
            ];

            this.beneficiariesSubject.next(updatedBeneficiaries);
            this.updateBeneficiaryCount(updatedBeneficiaries.length);
            this.updateLocalStorage('beneficiaries', updatedBeneficiaries);
          }
          return response;
        }),
        catchError((error) => throwError(() => error))
      );
  }

  setBeneficiaries(beneficiaries: Beneficiary[]): void {
    this.beneficiariesSubject.next(beneficiaries);
    this.updateBeneficiaryCount(beneficiaries.length);
    this.updateLocalStorage('beneficiaries', beneficiaries);
  }

  setActiveBeneficiary(beneficiary: Beneficiary | null): void {
    if (!beneficiary) {
      this.activeBeneficiarySubject.next(null);
      localStorage.removeItem('activeBeneficiary');
      return;
    }
    
    this.activeBeneficiarySubject.next({ ...beneficiary });
    localStorage.setItem('activeBeneficiary', JSON.stringify(beneficiary));
  }
  
  private loadActiveBeneficiary(): Beneficiary | null {
    const storedBeneficiary = localStorage.getItem('activeBeneficiary');
    return storedBeneficiary ? JSON.parse(storedBeneficiary) : null;
  }

  updateBeneficiary(id: number | string, data: Partial<Beneficiary>): Observable<any> {
    
    return this.http.put(`${apiUrl}api/patients/${id}`, data).pipe(
      map((response: any) => {
        if (response.success === true && response.data) {
          const updatedBeneficiary = response.data;
          const currentBeneficiaries = this.beneficiariesSubject.value;
          
          const index = currentBeneficiaries.findIndex(b => b.id === id);
          
          if (index !== -1) {
            const updatedBeneficiaries = [...currentBeneficiaries];
            updatedBeneficiaries[index] = updatedBeneficiary;
            // Actualizar el estado y localStorage
            this.beneficiariesSubject.next(updatedBeneficiaries);
            try {
              this.updateLocalStorage('beneficiaries', updatedBeneficiaries);
              // Verificar datos almacenados en localStorage
              const storedData = localStorage.getItem('beneficiaries');
              if (storedData) {
                const parsedData = JSON.parse(storedData);
                
                // Verificar si el beneficiario actualizado está en localStorage
                const storedBeneficiary = parsedData.find((b: Beneficiary) => b.id === id);
              } else {
              }
            } catch (error) {
            }
            
            // Si el beneficiario activo fue actualizado, actualizar también esa referencia
            const activeBeneficiary = this.getActiveBeneficiary();
            
            if (activeBeneficiary && activeBeneficiary.id === id) {
              this.setActiveBeneficiary(updatedBeneficiary);
            }
          } else {
            console.warn("⚠️ No se encontró el beneficiario con id:", id);
          }
        } else {
          console.warn("⚠️ Respuesta del servidor sin datos o con error:", response);
        }
        return response;
      }),
      catchError((error) => {
        console.error("❌ Error al actualizar beneficiario:", error);
        return throwError(() => error);
      })
    );
  }
  
  removeBeneficiary(id: number | string): void {
    const currentBeneficiaries = this.beneficiariesSubject.value;
    const updatedBeneficiaries = currentBeneficiaries.filter(b => b.id !== id);
  
    this.beneficiariesSubject.next(updatedBeneficiaries);
    this.updateBeneficiaryCount(updatedBeneficiaries.length);
    this.updateLocalStorage('beneficiaries', updatedBeneficiaries);
    
    // Si eliminamos el beneficiario activo, limpiarlo
    const activeBeneficiary = this.getActiveBeneficiary();
    if (activeBeneficiary && activeBeneficiary.id === id) {
      this.setActiveBeneficiary(null);
    }
  }
  
  private updateLocalStorage<T>(key: string, items: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error(`Error al guardar en localStorage (${key}):`, error);
    }
  }
  
  getActiveBeneficiary(): Beneficiary | null {
    return this.activeBeneficiarySubject.value;
  }

  getBeneficiaries(): Beneficiary[] {
    return this.beneficiariesSubject.value;
  }

  clearBeneficiaries(): void {
    this.beneficiariesSubject.next([]);
    this.updateBeneficiaryCount(0); 
    localStorage.removeItem('beneficiaries');
  }

  getBeneficiaryById(id: number | string): Observable<Beneficiary | undefined> {
    return this.beneficiaries$.pipe(
      map((beneficiaries) => beneficiaries.find(b => b.id === id))
    );
  }
  
  private updateBeneficiaryCount(count: number): void {
    this.beneficiaryCountSubject.next(count);
  }

  // Método para recargar beneficiarios desde el servidor
  fetchBeneficiaries(): Observable<Beneficiary[]> {
    const user = this.userService.getUser();
    
    if (!user || !user.id) {
      return throwError(() => new Error('Usuario no autenticado.'));
    }
    
    return this.http.get<any>(`${apiUrl}api/patients/by-user/${user.id}`).pipe(
      map((response: any) => {
        if (response.statusCode === 200 && response.data) {
          const beneficiaries = response.data;
          this.setBeneficiaries(beneficiaries);
          return beneficiaries;
        } else {
          return [];
        }
      }),
      catchError((error) => {
        console.error('Error al obtener beneficiarios:', error);
        return throwError(() => error);
      })
    );
  }
}