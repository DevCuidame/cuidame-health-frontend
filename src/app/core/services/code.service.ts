import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { personaData } from 'src/app/core/interfaces/personaData.interface';

@Injectable({
  providedIn: 'root'
})
export class CodeService {
  private apiUrl = environment.url;
  
  // Current person data
  private personSubject = new BehaviorSubject<personaData | null>(null);
  public person$ = this.personSubject.asObservable();
  
  // Insurance code
  private insuranceCodeSubject = new BehaviorSubject<string>('');
  public insuranceCode$ = this.insuranceCodeSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load stored data on service initialization
    this.loadStoredPersonData();
  }

  /**
   * Verify insurance band code
   * @param formData Form data with code and agreement
   */
  verifyInsuranceCode(formData: any): Observable<any> {
    console.log("🚀 ~ CodeService ~ verifyInsuranceCode ~ formData:", formData)
    return this.http.post(`${this.apiUrl}api/code/authenticate`, formData)
      .pipe(
        map((response: any) => {
          if (response.success) {
            // Store insurance code for later use
            this.setInsuranceCode(formData.code);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get available insurance agreements
   */
  getAgreements(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/code/agreements`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Set person data
   * @param data Person data
   */
  setPersonData(data: personaData): void {
    this.personSubject.next(data);
    localStorage.setItem('personData', JSON.stringify(data));
  }

  /**
   * Get current person data
   */
  getPersonData(): personaData | null {
    return this.personSubject.value;
  }

  /**
   * Set insurance code
   * @param code Insurance code
   */
  setInsuranceCode(code: string): void {
    this.insuranceCodeSubject.next(code);
    localStorage.setItem('insuranceCode', code);
  }

  /**
   * Get current insurance code
   */
  getInsuranceCode(): string {
    return this.insuranceCodeSubject.value;
  }

  /**
   * Clear person data
   */
  clearPersonData(): void {
    this.personSubject.next(null);
    this.insuranceCodeSubject.next('');
    localStorage.removeItem('personData');
    localStorage.removeItem('insuranceCode');
  }

  /**
   * Load stored person data from localStorage
   */
  private loadStoredPersonData(): void {
    const storedPerson = localStorage.getItem('personData');
    const storedCode = localStorage.getItem('insuranceCode');
    
    if (storedPerson) {
      try {
        const parsedData = JSON.parse(storedPerson);
        this.personSubject.next(parsedData);
      } catch (error) {
        console.error('Error parsing stored person data', error);
        localStorage.removeItem('personData');
      }
    }
    
    if (storedCode) {
      this.insuranceCodeSubject.next(storedCode);
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any) {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error: ${error.status} - ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}