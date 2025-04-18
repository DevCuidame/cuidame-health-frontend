// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RegisterData, User } from 'src/app/core/interfaces/auth.interface';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from '../../../core/services/beneficiary.service';
import { NavController } from '@ionic/angular';
const apiUrl = environment.url;


@Injectable({ providedIn: 'root' })
export class AuthService {

  private authState = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private userService: UserService, private beneficiaryService: BeneficiaryService, private navController: NavController) {
    this.authState.next(this.hasToken());
  }

  isAuthenticated$(): Observable<boolean> {
    return this.authState.asObservable();
  }


  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${apiUrl}api/auth/login`, credentials).pipe(
      map((response: any) => {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('refresh-token', response.data.refresh_token);
        
        // Set user data in UserService and localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        this.userService.setUser(response.data.user as User);

        // Set beneficiaries if available
        if (response.data.cared_persons) {
          localStorage.setItem('beneficiaries', JSON.stringify(response.data.cared_persons));
          this.beneficiaryService.setBeneficiaries(response.data.cared_persons as Beneficiary[]);
        }
        
        // Update authentication state
        this.authState.next(true);

        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => ({
          status: error.status,
          error: error.error,
          message: error.error?.error || 'Authentication error'
        }));
      })
    );
  }

  register(credentials: RegisterData): Observable<any> {
    return this.http.post(`${apiUrl}api/auth/register`, credentials)
      .pipe(
        catchError(error => {
          let errorMessage = 'Error en el registro';
          
          if (error.error) {
            if (typeof error.error === 'string' && error.error.includes('Error:')) {
              const errorMatch = error.error.match(/Error: ([^<]+)</);
              if (errorMatch && errorMatch[1]) {
                errorMessage = errorMatch[1].trim();
              }
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          }
          
          // Devolver un error con formato consistente
          return throwError(() => ({
            status: error.status,
            message: errorMessage,
            originalError: error
          }));
        })
      );
  }

  /**
 * Reenvía el correo de verificación al usuario
 * @param email Email del usuario
 */
resendVerificationEmail(email: string): Observable<any> {
  return this.http.post(`${apiUrl}api/email/resend`, { email }).pipe(
    catchError(error => {
      console.error('Error al reenviar correo de verificación:', error);
      return throwError(() => error);
    })
  );
}



  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh-token');
    localStorage.removeItem('user');
    localStorage.removeItem('beneficiaries');
    localStorage.removeItem('activeBeneficiary');
    this.authState.next(false);
    this.userService.clearUser();
    this.beneficiaryService.clearBeneficiaries();
  }

  getBeneficiariesData(): Beneficiary[] {
    return JSON.parse(localStorage.getItem('beneficiaries') || '[]');
  }

  getUserData(): any {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  isAuthenticated(): boolean {
    return this.authState.value;
  }

  isAgent(): boolean {
    const user = this.getUserData();
    return user && user.isAgent === true;
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh-token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post(`${apiUrl}api/auth/refresh-token`, { refreshToken }).pipe(
      map((response: any) => {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refresh-token', response.data.refreshToken);
        return response.data;
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

 // Add this improved refreshUserData method to your AuthService

refreshUserData(): void {
  const user = this.getUserData();

  if (user) {
    const normalizedUser = Array.isArray(user) ? user[0] : user;
    
    if (normalizedUser.location && Array.isArray(normalizedUser.location) && normalizedUser.location.length > 0) {
      normalizedUser.location = normalizedUser.location[0];
    }
    
    this.userService.setUser(normalizedUser);
  } 

  const beneficiaries = this.getBeneficiariesData();

  if (beneficiaries.length > 0) {
    this.beneficiaryService.setBeneficiaries(beneficiaries);
  }
}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
}
