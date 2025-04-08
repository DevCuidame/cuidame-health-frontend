import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
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

            localStorage.setItem(
              'beneficiaries',
              JSON.stringify(updatedBeneficiaries)
            );
          }
          return response;
        }),
        catchError((error) => throwError(() => error))
      );
  }


  setBeneficiaries(beneficiaries: Beneficiary[]): void {
    this.beneficiariesSubject.next(beneficiaries);
    this.updateBeneficiaryCount(beneficiaries.length);
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
    return this.http.put(`${apiUrl}api/v1/beneficiary/update/${id}`, data).pipe(
      map((response: any) => {
        if (response.statusCode === 200 && response.data) {
          console.log("🚀 ~ BeneficiaryService ~ map ~ response:", response)
          const updatedBeneficiary = response.data;
          const currentBeneficiaries = this.beneficiariesSubject.value;
  
          const updatedBeneficiaries = currentBeneficiaries.map(b =>
            b.id === id ? { ...b, ...updatedBeneficiary } : b
          );
  
          this.beneficiariesSubject.next(updatedBeneficiaries);
          localStorage.setItem('beneficiaries', JSON.stringify(updatedBeneficiaries));
        }
        return response;
      }),
      catchError((error) => throwError(() => error))
    );
  }
  
  
  removeBeneficiary(id: number | string): void {
    const currentBeneficiaries = this.beneficiariesSubject.value;
    const updatedBeneficiaries = currentBeneficiaries.filter(b => b.id !== id);
  
    this.beneficiariesSubject.next(updatedBeneficiaries);
    this.updateBeneficiaryCount(updatedBeneficiaries.length);
    localStorage.setItem('beneficiaries', JSON.stringify(updatedBeneficiaries));
  }
  
  private updateLocalStorage<T>(key: string, items: T[]): void {
    localStorage.setItem(key, JSON.stringify(items));
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
    return this.beneficiaries$.pipe(
      map((beneficiaries) => beneficiaries.find(b => b.id === id))
    );
  }
  
  private updateBeneficiaryCount(count: number): void {
    this.beneficiaryCountSubject.next(count);
  }
}
