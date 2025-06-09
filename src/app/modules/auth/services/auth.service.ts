// src/app/core/services/auth.service.ts
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, from } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { RegisterData, User } from 'src/app/core/interfaces/auth.interface';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from '../../../core/services/beneficiary.service';
import { NavController } from '@ionic/angular';
import { StorageService } from 'src/app/core/services/storage.service';
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
    private injector: Injector,
    private storage: StorageService
  ) {
    this.checkAuthState();

    this.authState.next(this.hasToken());
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.loadUserFromStorage();
  }

  private checkAuthState(): void {
    this.storage.getItem('token').subscribe(
      (token) => {
        this.authState.next(!!token);
      },
      (error) => {
        console.error('Error checking auth state:', error);
        this.authState.next(false);
      }
    );
  }

  private loadUserFromStorage(): void {
    this.storage.getItem('user').subscribe(
      (userData) => {
        if (userData) {
          this.currentUserSubject.next(userData as User);
          this.userService.setUser(userData as User);
        }
      },
      (error) => {
        console.error('Error loading user data:', error);
      }
    );
  }

 /**
 * Verifica si el usuario está autenticado de forma reactiva
 * @returns Observable<boolean> que emite true si el usuario está autenticado, false en caso contrario
 */
isAuthenticated$(): Observable<boolean> {
  // Primero verificar estado actual
  if (this.authState.value === true) {
    return of(true);
  }
  
  // Si el estado dice que no está autenticado, verificar si hay token
  return this.storage.getItem('token').pipe(
    map(token => {
      const isAuth = !!token;
      
      // Si encontramos un token, actualizar el estado
      if (isAuth && this.authState.value !== true) {
        this.authState.next(true);
      }
      
      return isAuth;
    }),
    catchError(error => {
      console.warn('Error verificando token en storage:', error);
      
      // Verificar en localStorage como fallback
      try {
        const tokenInLocalStorage = !!localStorage.getItem('token');
        if (tokenInLocalStorage) {
          this.authState.next(true);
          return of(true);
        }
      } catch (e) {}
      
      return of(false);
    })
  );
}

/**
 * Verifica si el usuario está autenticado (versión síncrona)
 * Esta es la versión simple, que solo verifica el estado actual
 * @returns boolean que indica si el usuario está autenticado según el estado actual
 */
// isAuthenticated(): boolean {
//   // Primero verificar estado en authState
//   if (this.authState.value === true) {
//     return true;
//   }
  
//   // Si no, verificar en localStorage
//   try {
//     const hasToken = !!localStorage.getItem('token');
    
//     // Actualizar el estado si encontramos token pero el estado dice lo contrario
//     if (hasToken && !this.authState.value) {
//       this.authState.next(true);
//     }
    
//     return hasToken;
//   } catch (e) {
//     return false;
//   }
// }

 /**
 * Método de inicio de sesión mejorado con manejo de errores
 * y almacenamiento asíncrono
 */

login(credentials: { email: string; password: string }): Observable<any> {
  // Convertir email a minúsculas antes de enviarlo
  const normalizedCredentials = {
    ...credentials,
    email: credentials.email.toLowerCase(),
  };

  return this.http
    .post(`${apiUrl}api/auth/login`, normalizedCredentials)
    .pipe(
      catchError(error => {
        return throwError(() => ({
          status: error.status,
          error: error.error,
          message: error.error?.error || 'Inicio de sesión fallido. Verifica tus credenciales.',
        }));
      }),
      tap(),
      switchMap((response: any) => {
        // 1. Guardar tokens (lo más importante)
        return this.saveTokens(response).pipe(
          // 2. Guardar datos del usuario
          switchMap(() => this.saveUserData(response)),
          // 3. Guardar beneficiarios preservando toda la estructura
          switchMap(() => this.saveBeneficiaries(response)),
          // 4. Devolver la respuesta original
          map(() => response)
        );
      })
    );
}

// Métodos auxiliares para separar la lógica

private saveTokens(response: any): Observable<any> {
  // Guardar access_token
  return this.storage.setItem('token', response.data.access_token).pipe(
    catchError(error => {
      console.warn('Error al guardar token:', error);
      try {
        localStorage.setItem('token', response.data.access_token);
      } catch (e) {
        console.error('No se pudo guardar token en ningún almacenamiento');
      }
      return of(null);
    }),
    // Guardar refresh_token
    switchMap(() => {
      return this.storage.setItem('refresh-token', response.data.refresh_token).pipe(
        catchError(error => {
          console.warn('Error al guardar refresh token:', error);
          try {
            localStorage.setItem('refresh-token', response.data.refresh_token);
          } catch (e) {}
          return of(null);
        })
      );
    })
  );
}

private saveUserData(response: any): Observable<any> {
  const userData = response.data.user;
  
  // Actualizar estado en memoria inmediatamente
  this.userService.setUser(userData as User);
  this.currentUserSubject.next(userData as User);
  this.authState.next(true);
  
  // Guardar en almacenamiento
  return this.storage.setItem('user', userData).pipe(
    catchError(error => {
      console.warn('Error al guardar datos de usuario:', error);
      return of(userData);
    })
  );
}

private saveBeneficiaries(response: any): Observable<any> {
  if (!response.data.cared_persons || !response.data.cared_persons.length) {
    return of(null);
  }

  // DEFINIR LA FUNCIÓN PRIMERO
  const prepareBeneficiaries = (data: any[]) => {
    return data.map(b => {
      const cleanBeneficiary: any = {
        ...b,
        health_data: b.health_data || null,
        ciudad: b.ciudad || null,
        department_name: b.department_name || null
      };
      return cleanBeneficiary;
    });
  };


  const beneficiaries = JSON.parse(JSON.stringify(response.data.cared_persons));

  const preparedData = prepareBeneficiaries(beneficiaries); // LLAMAR DESPUÉS DE DEFINIR

  return from(this.storage.setItem('beneficiaries', preparedData)).pipe(
    tap(savedData => {
    }),
    catchError(error => {
      // ... (tu lógica de fallback)
      const minimalData = beneficiaries.map((b: any) => ({ /* ... */ })); // Asegúrate que 'beneficiaries' aquí es la versión correcta.
      try {
        localStorage.setItem('beneficiaries', JSON.stringify(minimalData));
        this.beneficiaryService.setBeneficiariesDirectly(minimalData);
        return of(minimalData);
      } catch (lsError) {
        this.beneficiaryService.setBeneficiariesDirectly(beneficiaries); // O 'preparedData' si quieres ser consistente
        return throwError(() => new Error('All storage methods failed'));
      }
    })
  );
}

  register(credentials: RegisterData): Observable<any> {
    // Normalizar email a minúsculas
    const normalizedCredentials = {
      ...credentials,
      email: credentials.email.toLowerCase(),
    };

    return this.http
      .post(`${apiUrl}api/auth/register`, normalizedCredentials)
      .pipe(
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

  /**
 * Cierra sesión y limpia los datos de usuario
 * @returns Observable que completa cuando se cierra la sesión
 */
logout(): Observable<void> {
  // Primero limpiamos estado en memoria para respuesta inmediata
  this.authState.next(false);
  this.userService.clearUser();
  this.beneficiaryService.clearBeneficiaries();
  this.currentUserSubject.next(null);
  
  // Luego intentamos limpiar almacenamiento
  return this.storage.clear().pipe(
    catchError(error => {
      console.warn('Error al limpiar almacenamiento durante logout:', error);
      
      // Intentar limpiar localStorage como fallback
      try {
        localStorage.clear()
        localStorage.removeItem('token');
        localStorage.removeItem('refresh-token');
        localStorage.removeItem('user');
        localStorage.removeItem('beneficiaries');
        localStorage.removeItem('activeBeneficiary');
      } catch (e) {
        console.error('Error limpiando localStorage:', e);
      }
      
      // Devolver completado aún con error
      return of(undefined);
    }),
    // Convertir undefined a void para tipo correcto
    map(() => void 0)
  );
}

  getBeneficiariesData(): Observable<Beneficiary[]> {
    return this.storage
      .getItem('beneficiaries')
      .pipe(map((data) => data || []));
  }

  getUserData(): Observable<User | null> {
    return this.storage.getItem('user');
  }

  getDataFromApi(): Observable<any> {
    return this.http.get(`${apiUrl}api/users/profile`).pipe(
      catchError((error) => {
        console.error(
          'Error al obtener los datos completos del usuario:',
          error
        );
        return throwError(() => error);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.authState.value;
  }

  isAgent(): boolean {
    const user = this.getUserData();
    return this.currentUserValue?.isAgent === true;
  }

  isAdmin(): boolean {
    const user = this.getUserData();
    return this.currentUserValue?.isAdmin === true;
  }

  /**
   * Método mejorado para refrescar el token de autenticación
   * @returns Observable con los nuevos tokens
   */
  refreshToken(): Observable<any> {
    return this.storage.getItem('refresh-token').pipe(
      switchMap((refreshToken) => {
        if (!refreshToken) {
          return throwError(() => new Error('No refresh token available'));
        }

        return this.http
          .post(`${apiUrl}api/auth/refresh-token`, { refreshToken })
          .pipe(
            switchMap((response: any) => {
              // Guardar los nuevos tokens
              return this.storage
                .setItem('token', response.data.accessToken)
                .pipe(
                  switchMap(() =>
                    this.storage.setItem(
                      'refresh-token',
                      response.data.refreshToken
                    )
                  ),
                  map(() => response.data)
                );
            }),
            catchError((error) => {
              // En caso de error, hacer logout
              return this.logout().pipe(
                switchMap(() => throwError(() => error))
              );
            })
          );
      })
    );
  }

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

  /**
   * Elimina la cuenta del usuario actual
   * @param data Datos necesarios para la eliminación (contraseña, razón, etc.)
   * @returns Observable con la respuesta del servidor
   */
  deleteAccount(data: {
    password: string;
    reason?: string;
    otherReason?: string;
    confirmation: string;
  }): Observable<any> {
    const endpoint = `${environment.url}api/auth/delete-account`;
    
    return this.http.delete(endpoint, {
      body: {
        password: data.password,
        reason: data.reason,
        otherReason: data.otherReason,
        confirmation: data.confirmation,
      }
    });
  }

  getAccountDeletionInfo(): Observable<any> {
    const endpoint = `${environment.url}api/auth/account-deletion-info`;
    return this.http.get(endpoint);
  }

  verifyPasswordForDeletion(password: string): Observable<any> {
    const endpoint = `${environment.url}api/auth/verify-password`;
    return this.http.post(endpoint, { password });
  }

}
