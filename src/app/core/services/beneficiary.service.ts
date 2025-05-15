import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
  firstValueFrom,
  from,
} from 'rxjs';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { environment } from 'src/environments/environment';
import { UserService } from '../../modules/auth/services/user.service';
import { LoadingService } from './loading.service';
import { ToastService } from './toast.service';
import { StorageService } from './storage.service';
import { User } from 'src/app/core/interfaces/auth.interface';
import { CacheService } from './cache-service';
import { ErrorHandlerService } from './error-handler.service';

const apiUrl = environment.url;
const BENEFICIARIES_STORAGE_KEY = 'beneficiaries';
const ACTIVE_BENEFICIARY_KEY = 'activeBeneficiary';

@Injectable({ providedIn: 'root' })
export class BeneficiaryService {
  private beneficiariesSubject = new BehaviorSubject<Beneficiary[]>([]);
  public beneficiaries$ = this.beneficiariesSubject.asObservable();

  private beneficiaryCountSubject = new BehaviorSubject<number>(0);
  public beneficiaryCount$ = this.beneficiaryCountSubject.asObservable();

  public maxBeneficiariesSubject = new BehaviorSubject<number>(5);
  public maxBeneficiaries$ = this.maxBeneficiariesSubject.asObservable();

  // Active beneficiary subject
  private activeBeneficiarySubject = new BehaviorSubject<Beneficiary | null>(
    null
  );
  public activeBeneficiary$ = this.activeBeneficiarySubject.asObservable();

  // Loading status
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Flag para evitar múltiples peticiones
  private fetchInProgress = false;
  private currentFetchRequest: Observable<Beneficiary[]> | null = null;

  // Servicio de usuario privado
  private userService: UserService | null = null;

  constructor(
    private http: HttpClient,
    private injector: Injector,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private storageService: StorageService,
    private cacheService: CacheService,
    private errorHandlerService: ErrorHandlerService
  ) {
    // Inicializar datos desde el almacenamiento
    this.loadActiveBeneficiaryFromStorage();

    setTimeout(() => {
      this.userService = this.injector.get(UserService);
      // Intentar cargar beneficiarios solo si hay un usuario autenticado
      this.getUserInfoAsync().subscribe({
        next: (user) => {
          if (user && user.id) {
            this.fetchBeneficiaries().subscribe(
              () => {},
              (error) =>
                console.warn(
                  'Error cargando familiares inicialmente:',
                  error
                )
            );
          }
        },
        error: (error) =>
          console.warn('No hay usuario autenticado inicialmente'),
      });
    });

    // Escuchar cambios en el almacenamiento
    this.storageService.storageChange$.subscribe((change) => {
      if (change.key === BENEFICIARIES_STORAGE_KEY) {
        if (change.value) {
          this.beneficiariesSubject.next(change.value);
          this.updateBeneficiaryCount(change.value.length);
        } else {
          this.beneficiariesSubject.next([]);
          this.updateBeneficiaryCount(0);
        }
      } else if (change.key === ACTIVE_BENEFICIARY_KEY) {
        this.activeBeneficiarySubject.next(change.value);
      } else if (change.key === 'user') {
        // Si cambió el usuario, podríamos necesitar recargar beneficiarios
        if (change.value && change.value.id) {
          this.fetchBeneficiariesIfNeeded();
        }
      }
    });
  }

  /**
   * Verifica si necesitamos recargar los beneficiarios (por ejemplo, después de un login)
   */
  private fetchBeneficiariesIfNeeded(): void {
    if (this.beneficiariesSubject.value.length === 0) {
      this.fetchBeneficiaries().subscribe(
        () => {},
        (error) =>
          console.warn(
            'Error cargando familiares después de cambio de usuario:',
            error
          )
      );
    }
  }

  /**
   * Obtiene el usuario de forma asíncrona
   * @returns Observable con el usuario o null
   */
  private getUserInfoAsync(): Observable<User | null> {
    if (!this.userService) {
      this.userService = this.injector.get(UserService);
    }

    // Primero intenta obtener del estado actual
    const currentUser = this.userService.getUser();
    if (currentUser && currentUser.id) {
      return of(currentUser);
    }

    // Si no hay usuario en el estado actual, intenta obtenerlo del almacenamiento
    return this.storageService.getItem('user').pipe(
      map((userData) => {
        if (userData && userData.id) {
          // Si encontramos un usuario en el almacenamiento pero no estaba en el estado,
          // actualizamos el estado también
          if (this.userService) {
            this.userService.setUser(userData);
          }
          return userData;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Obtiene el usuario de forma síncrona (solo para compatibilidad con código existente)
   * NOTA: Este método debe usarse con precaución, ya que puede devolver null si el usuario
   * aún no se ha cargado. Es preferible usar getUserInfoAsync.
   */
  private getUserInfo(): User | null {
    if (!this.userService) {
      this.userService = this.injector.get(UserService);
    }
    return this.userService.getUser();
  }

  addBeneficiary(data: Beneficiary): Observable<any> {
    return this.getUserInfoAsync().pipe(
      switchMap((user) => {
        if (!user || !user.id) {
          return throwError(() => new Error('Usuario no autenticado.'));
        }
  
        // Mostrar loading
        this.isLoadingSubject.next(true);
        this.loadingService.showLoading('Guardando familiar...');
  
        const beneficiary = {
          ...data,
          a_cargo_id: user.id,
        };
  
        return this.http.post(`${apiUrl}api/patients`, beneficiary).pipe(
          map((response: any) => {
            if (response.success && response.data) {
              // Actualizar la lista de beneficiarios
              this.fetchBeneficiaries().subscribe();
            }
            return response;
          }),
          catchError((error) => {
            // Usar el servicio de manejo de errores
            return this.errorHandlerService.handleError(error, 'Error al crear familiar');
          }),
          finalize(() => {
            // Ocultar loading
            this.isLoadingSubject.next(false);
            this.loadingService.hideLoading();
          })
        );
      })
    );
  }
  

  /**
   * Establece los familiars directamente desde otro servicio
   * (usado por ejemplo en el proceso de login)
   * @param beneficiaries Lista de familiars a establecer
   */
  setBeneficiariesDirectly(beneficiaries: Beneficiary[]): void {
    if (!beneficiaries || !Array.isArray(beneficiaries)) {
      return;
    }

    // Actualizar el estado local
    this.beneficiariesSubject.next(beneficiaries);
    this.updateBeneficiaryCount(beneficiaries.length);

    // No necesitamos guardar en storage porque el que llama
    // a este método ya debería haberlo hecho
  }

  fetchBeneficiaries(): Observable<Beneficiary[]> {
    // Si ya hay una petición en progreso, reutilizarla en lugar de hacer otra
    if (this.fetchInProgress && this.currentFetchRequest) {
      return this.currentFetchRequest;
    }

    // Usar la versión asíncrona para obtener el usuario
    return this.getUserInfoAsync().pipe(
      switchMap((user) => {
        if (!user || !user.id) {
          this.loadingService.hideLoading(); // Forzar cierre y reinicio
          this.isLoadingSubject.next(false);
          return throwError(() => new Error('Usuario no autenticado.'));
        }

        // Marcar que hay una petición en progreso
        this.fetchInProgress = true;

        // Intentar primero obtener de la caché para mostrar datos inmediatamente
        this.cacheService
          .get(BENEFICIARIES_STORAGE_KEY)
          .subscribe((cachedData: any) => {
            if (cachedData) {
              this.beneficiariesSubject.next(cachedData);
              this.updateBeneficiaryCount(cachedData.length);
            }
          });

        this.currentFetchRequest = this.http
          .get<any>(`${apiUrl}api/patients/my-patients`)
          .pipe(
            map((response: any) => {
              if (response.success && response.data) {
                const beneficiaries = response.data;

                // Guardar en almacenamiento y caché
                this.storageService
                  .setItem(BENEFICIARIES_STORAGE_KEY, beneficiaries)
                  .subscribe();

                // Actualizar el estado
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
              // this.toastService.presentToast(
              //   'Error al cargar familiars',
              //   'danger'
              // );
              return throwError(() => error);
            }),
            finalize(() => {
              // Ocultar loading
              this.isLoadingSubject.next(false);

              // Notificar que la solicitud está completa
              this.loadingService.hideLoading();

              // Resetear las flags de petición en progreso
              this.fetchInProgress = false;
              this.currentFetchRequest = null;
            }),
            // Compartir la misma respuesta entre múltiples suscriptores
            shareReplay(1)
          );

        return this.currentFetchRequest;
      })
    );
  }

  setActiveBeneficiary(beneficiary: Beneficiary | null): void {
    if (!beneficiary) {
      this.activeBeneficiarySubject.next(null);
      this.storageService.removeItem(ACTIVE_BENEFICIARY_KEY).subscribe();
      return;
    }

    // Actualizar estado local primero para respuesta inmediata
    this.activeBeneficiarySubject.next({ ...beneficiary });

    // Guardar en almacenamiento
    this.storageService
      .setItem(ACTIVE_BENEFICIARY_KEY, beneficiary)
      .subscribe(null, (error) => {
        console.error('Error al guardar familiar activo:', error);
        // Si falla, intentar guardar versión reducida
        const minimalBeneficiary = {
          id: beneficiary.id,
          name: beneficiary.nombre,
          lastname: beneficiary.apellido,
          tipoid: beneficiary.tipoid,
          numeroid: beneficiary.numeroid,
          telefono: beneficiary.telefono,
          fecha_nacimiento: beneficiary.fecha_nacimiento,
          genero: beneficiary.genero,
          ciudad: beneficiary.ciudad,
          departamento: beneficiary.departamento,
          direccion: beneficiary.direccion,
          rh: beneficiary.rh,
          eps: beneficiary.eps,
          prepagada: beneficiary.prepagada,
          arl: beneficiary.arl,
          seguro_funerario: beneficiary.seguro_funerario,
          a_cargo_id: beneficiary.a_cargo_id,
          image: beneficiary.image,
          enterprise: beneficiary.enterprise,
          nit: beneficiary.nit,
        };
        this.storageService
          .setItem(ACTIVE_BENEFICIARY_KEY, minimalBeneficiary)
          .subscribe();
      });
  }

  private loadActiveBeneficiaryFromStorage(): void {
    this.storageService.getItem(ACTIVE_BENEFICIARY_KEY).subscribe(
      (storedBeneficiary) => {
        if (storedBeneficiary) {
          this.activeBeneficiarySubject.next(storedBeneficiary);
        }
      },
      (error) => {
        console.error('Error al cargar familiar activo:', error);
      }
    );
  }

  updateBeneficiary(
    id: number | string,
    data: Partial<Beneficiary>
  ): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Actualizando familiar...');

    return this.getUserInfoAsync().pipe(
      switchMap((user) => {
        if (!user || !user.id) {
          this.loadingService.hideLoading();
          this.isLoadingSubject.next(false);
          return throwError(() => new Error('Usuario no autenticado.'));
        }

        return this.http.put(`${apiUrl}api/patients/${id}`, data).pipe(
          map((response: any) => {
            if (response.success === true && response.data) {
              const updatedBeneficiary = response.data;

              // Actualizar la lista completa de beneficiarios
              this.fetchBeneficiaries().subscribe();

              // Si el beneficiario activo fue actualizado, actualizar también esa referencia
              const activeBeneficiary = this.activeBeneficiarySubject.value;
              if (activeBeneficiary && activeBeneficiary.id === id) {
                this.setActiveBeneficiary(updatedBeneficiary);
              }
            }
            return response;
          }),
          catchError((error) => {
            console.error('❌ Error al actualizar al familiar:', error);
            this.toastService.presentToast(
              'Error al actualizar familiar',
              'danger'
            );
            return throwError(() => error);
          }),
          finalize(() => {
            this.isLoadingSubject.next(false);
            this.loadingService.hideLoading();
          })
        );
      })
    );
  }

  removeBeneficiary(id: number | string): Observable<any> {
    this.isLoadingSubject.next(true);
    this.loadingService.showLoading('Eliminando familliar...');

    return this.getUserInfoAsync().pipe(
      switchMap((user) => {
        if (!user || !user.id) {
          this.loadingService.hideLoading();
          this.isLoadingSubject.next(false);
          return throwError(() => new Error('Usuario no autenticado.'));
        }

        return this.http.delete(`${apiUrl}api/patients/${id}`).pipe(
          tap(() => {
            // Actualizar la lista de beneficiarios tras eliminación
            this.fetchBeneficiaries().subscribe();

            // Si eliminamos el beneficiario activo, limpiarlo
            const activeBeneficiary = this.activeBeneficiarySubject.value;
            if (activeBeneficiary && activeBeneficiary.id === id) {
              this.setActiveBeneficiary(null);
            }

            this.toastService.presentToast(
              'Familiar eliminado correctamente',
              'success'
            );
          }),
          catchError((error) => {
            console.error('Error al eliminar familiar:', error);
            this.toastService.presentToast(
              'Error al eliminar familiar',
              'danger'
            );
            return throwError(() => error);
          }),
          finalize(() => {
            this.isLoadingSubject.next(false);
            this.loadingService.hideLoading();
          })
        );
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
    this.storageService.removeItem(BENEFICIARIES_STORAGE_KEY).subscribe();
  }

  getBeneficiaryById(id: number | string): Observable<Beneficiary | undefined> {
    // Intentar primero buscar en el estado actual
    const beneficiaries = this.getBeneficiaries();
    const found = beneficiaries.find((b) => b.id === id);

    if (found) {
      return of(found);
    }

    // Si no se encuentra en el estado actual, intentar obtener desde el almacenamiento
    return this.storageService.getItem(BENEFICIARIES_STORAGE_KEY).pipe(
      switchMap((storedBeneficiaries) => {
        if (storedBeneficiaries && Array.isArray(storedBeneficiaries)) {
          const foundInStorage = storedBeneficiaries.find((b) => b.id === id);
          if (foundInStorage) {
            return of(foundInStorage);
          }
        }

        // Si todavía no se encuentra, buscar en el servidor
        return this.getUserInfoAsync().pipe(
          switchMap((user) => {
            if (!user || !user.id) {
              return of(undefined);
            }

            return this.http.get<any>(`${apiUrl}api/patients/${id}`).pipe(
              map((response: any) => {
                if (response.statusCode === 200 && response.data) {
                  return response.data;
                }
                return undefined;
              }),
              catchError((error) => {
                console.error('Error al obtener familiar por ID:', error);
                return of(undefined);
              })
            );
          })
        );
      })
    );
  }

  private updateBeneficiaryCount(count: number): void {
    this.beneficiaryCountSubject.next(count);
  }
}
