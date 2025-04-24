// src/app/core/services/auth.service.ts
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  // Evitamos la dependencia circular usando Injector para servicios relacionados con beneficiarios
  private navController: NavController | null = null;
  private beneficiaryServiceInjected = false;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private beneficiaryService: BeneficiaryService,
    private injector: Injector
  ) {
    this.authState.next(this.hasToken());
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  isAuthenticated$(): Observable<boolean> {
    return this.authState.asObservable();
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${apiUrl}api/auth/login`, credentials).pipe(
      map((response: any) => {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('refresh-token', response.data.refresh_token);

        const userData = response.data.user;

        try {
          // Store user data without large fields
          localStorage.setItem('user', JSON.stringify(userData));
          this.userService.setUser(userData as User);
        } catch (e) {
          console.warn('Error storing user data in localStorage:', e);
          // If localStorage fails, store minimal user data
          const minimalUser = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            lastname: userData.lastname,
            verificado: userData.verificado,
          };
          localStorage.setItem('user', JSON.stringify(minimalUser));
          // Still keep full user data in memory
          this.userService.setUser(userData as User);
        }

        // Set beneficiaries if available, but without images
        if (response.data.cared_persons) {
          try {
            // Store beneficiaries data (which should have imagebs64 removed)
            localStorage.setItem(
              'beneficiaries',
              JSON.stringify(response.data.cared_persons)
            );
            // this.beneficiaryService.setBeneficiaries(
            //   response.data.cared_persons as Beneficiary[]);
          } catch (e) {
            console.warn(
              'Error storing beneficiaries data in localStorage:',
              e
            );
            // If localStorage fails, don't store beneficiaries
            // Just keep them in memory
            // this.beneficiaryService.setBeneficiaries(
            //   response.data.cared_persons as Beneficiary[]);
          }
        }

        // Update authentication state
        this.authState.next(true);

        return response;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => ({
          status: error.status,
          error: error.error,
          message: error.error?.error || 'Authentication error',
        }));
      })
    );
  }

  register(credentials: RegisterData): Observable<any> {
    return this.http.post(`${apiUrl}api/auth/register`, credentials).pipe(
      catchError((error) => {
        let errorMessage = 'Error en el registro';

        if (error.error) {
          if (
            typeof error.error === 'string' &&
            error.error.includes('Error:')
          ) {
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
          originalError: error,
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
      catchError((error) => {
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

    return this.http
      .post(`${apiUrl}api/auth/refresh-token`, { refreshToken })
      .pipe(
        map((response: any) => {
          localStorage.setItem('token', response.data.accessToken);
          localStorage.setItem('refresh-token', response.data.refreshToken);
          return response.data;
        }),
        catchError((error) => {
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

      if (
        normalizedUser.location &&
        Array.isArray(normalizedUser.location) &&
        normalizedUser.location.length > 0
      ) {
        normalizedUser.location = normalizedUser.location[0];
      }

      this.userService.setUser(normalizedUser);
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  // Método para obtener NavController de forma perezosa
  private getNavController(): NavController {
    if (!this.navController) {
      this.navController = this.injector.get(NavController);
    }
    return this.navController;
  }

  // Método para limpiar beneficiarios cuando sea necesario
  private clearBeneficiaries() {
    if (!this.beneficiaryServiceInjected) {
      try {
        // Intentamos obtener BeneficiaryService solo cuando sea necesario
        const beneficiaryService = this.injector.get(BeneficiaryService);
        if (
          beneficiaryService &&
          typeof beneficiaryService.clearBeneficiaries === 'function'
        ) {
          beneficiaryService.clearBeneficiaries();
        }
        this.beneficiaryServiceInjected = true;
      } catch (error) {
        console.warn('No se pudo obtener BeneficiaryService');
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getUser(): User | null {
    return this.getUserFromStorage();
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    return null;
  }


  // Enviar código para verificar el correo
  sendVerifyCode(email: string): Observable<any> {
    return this.http.post(`${environment.url}api/v1/email/resend`, { email });
  }

  // Verificar el correo con el código
  verifyEmail(code: string): Observable<any> {
    return this.http.post(`${environment.url}api/v1/email/verify`, { code });
  }
}
