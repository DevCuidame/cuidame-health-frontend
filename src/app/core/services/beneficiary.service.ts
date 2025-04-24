import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { environment } from 'src/environments/environment';
import { UserService } from '../../modules/auth/services/user.service';
import { LoadingService } from './loading.service';
import { ToastService } from './toast.service';

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

  // Loading status
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Servicio de usuario privado
  private userService: UserService | null = null;

  constructor(
    private http: HttpClient,
    private injector: Injector,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) {
    setTimeout(() => {
      this.userService = this.injector.get(UserService);
      this.fetchBeneficiaries().subscribe();
    });
  }

  addBeneficiary(data: Beneficiary): Observable<any> {
    // Obtenemos el usuario justo cuando se necesita
    const user = this.getUserInfo();

    if (!user || !user.id) {
      return throwError(() => new Error('Usuario no autenticado.'));
    }

    // Mostrar loading
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Guardando beneficiario...');

    const beneficiary = {
      ...data,
      a_cargo_id: user.id,
    };

    return this.http
      .post(`${apiUrl}api/patients`, beneficiary)
      .pipe(
        map((response: any) => {
          if (response.statusCode === 200 && response.data) {
            // Actualizar la lista de beneficiarios
            this.fetchBeneficiaries().subscribe();
          }
          return response;
        }),
        catchError((error) => {
          this.toastService.presentToast('Error al crear beneficiario', 'danger');
          return throwError(() => error);
        }),
        tap(() => {
          // Ocultar loading
          this.isLoadingSubject.next(false);
          this.loadingService.hideLoading();
        })
      );
  }

  // Método para obtener el usuario actual de forma segura
  private getUserInfo() {
    if (!this.userService) {
      this.userService = this.injector.get(UserService);
    }
    return this.userService.getUser();
  }

  // Método principal para obtener beneficiarios del servidor
  fetchBeneficiaries(): Observable<Beneficiary[]> {
    const user = this.getUserInfo();
    
    if (!user || !user.id) {
      return throwError(() => new Error('Usuario no autenticado.'));
    }
    
    // Mostrar loading si no es una recarga silenciosa
    if (this.beneficiariesSubject.value.length === 0) {
      this.isLoadingSubject.next(true);
      this.loadingService.showLoading('Cargando beneficiarios...');
    }
    
    return this.http.get<any>(`${apiUrl}api/patients/my-patients`).pipe(
      map((response: any) => {
        if (response.success && response.data) {
          const beneficiaries = response.data;
          this.beneficiariesSubject.next(beneficiaries);
          this.updateBeneficiaryCount(beneficiaries.length);
          return beneficiaries;
        } else {
          this.beneficiariesSubject.next([]);
          this.updateBeneficiaryCount(0);
          return [];
        }
      }),
      catchError((error) => {
        console.error('Error al obtener beneficiarios:', error);
        this.toastService.presentToast('Error al cargar beneficiarios', 'danger');
        return throwError(() => error);
      }),
      tap(() => {
        // Ocultar loading
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
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
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Actualizando beneficiario...');
    
    return this.http.put(`${apiUrl}api/patients/${id}`, data).pipe(
      map((response: any) => {
        if (response.success === true && response.data) {
          const updatedBeneficiary = response.data;
          
          // Actualizar la lista completa de beneficiarios
          this.fetchBeneficiaries().subscribe();
          
          // Si el beneficiario activo fue actualizado, actualizar también esa referencia
          const activeBeneficiary = this.getActiveBeneficiary();
          if (activeBeneficiary && activeBeneficiary.id === id) {
            this.setActiveBeneficiary(updatedBeneficiary);
          }
        }
        return response;
      }),
      catchError((error) => {
        console.error("❌ Error al actualizar beneficiario:", error);
        this.toastService.presentToast('Error al actualizar beneficiario', 'danger');
        return throwError(() => error);
      }),
      tap(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
  }
  
  removeBeneficiary(id: number | string): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Eliminando beneficiario...');
    
    return this.http.delete(`${apiUrl}api/patients/${id}`).pipe(
      tap(() => {
        // Actualizar la lista de beneficiarios tras eliminación
        this.fetchBeneficiaries().subscribe();
        
        // Si eliminamos el beneficiario activo, limpiarlo
        const activeBeneficiary = this.getActiveBeneficiary();
        if (activeBeneficiary && activeBeneficiary.id === id) {
          this.setActiveBeneficiary(null);
        }
        
        this.toastService.presentToast('Beneficiario eliminado correctamente', 'success');
      }),
      catchError((error) => {
        console.error('Error al eliminar beneficiario:', error);
        this.toastService.presentToast('Error al eliminar beneficiario', 'danger');
        return throwError(() => error);
      }),
      tap(() => {
        this.isLoadingSubject.next(false);
        this.loadingService.hideLoading();
      })
    );
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
  }

  getBeneficiaryById(id: number | string): Observable<Beneficiary | undefined> {
    // Intentar primero buscar en el estado actual
    const beneficiaries = this.getBeneficiaries();
    const found = beneficiaries.find(b => b.id === id);
    
    if (found) {
      return of(found);
    }
    
    // Si no se encuentra, buscar en el servidor
    return this.http.get<any>(`${apiUrl}api/patients/${id}`).pipe(
      map((response: any) => {
        if (response.statusCode === 200 && response.data) {
          return response.data;
        }
        return undefined;
      }),
      catchError((error) => {
        console.error('Error al obtener beneficiario por ID:', error);
        return of(undefined);
      })
    );
  }
  
  private updateBeneficiaryCount(count: number): void {
    this.beneficiaryCountSubject.next(count);
  }
}