import { Injectable } from '@angular/core';
import { Observable, Subject, throwError, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { UserService } from 'src/app/modules/auth/services/user.service';
import { BeneficiaryImage, UserImage } from 'src/app/core/interfaces/user.interface';
import { AppointmentStateService } from './appointment-state.service';

@Injectable({
  providedIn: 'root'
})
export class PatientSearchService {
  private searchTimeoutId: any;

  constructor(
    private userService: UserService,
    private stateService: AppointmentStateService
  ) {}

  /**
   * Realiza una búsqueda de paciente por tipo y número de identificación
   */
  public searchUserByIdentification(idType: string, idNumber: string): Observable<any> {
    
    // Reset search state
    this.stateService.searchState.set({
      loading: true,
      notFound: false,
      success: false,
      error: false
    });
  
    if (!idType || !idNumber) {
      this.stateService.searchState.set({
        loading: false,
        notFound: false,
        success: false,
        error: false
      });
      return of(null);
    }
  
    // Usar directamente el observable del servicio, sin crear un nuevo Subject
    return this.userService.findByIdentification(idType, idNumber).pipe(
      tap(userData => {
        if (userData) {
          this.handleUserFound(userData);
        } else {
          this.handleUserNotFound();
        }
      }),
      catchError(error => {
        this.stateService.searchState.set({
          loading: false,
          notFound: false,
          success: false,
          error: true
        });
        console.error('Error al buscar usuario:', error);
        return throwError(() => new Error('Error al buscar usuario'));
      }),
      finalize(() => {
      })
    );
  }

  /**
   * Procesa la respuesta cuando un usuario es encontrado
   */
  private handleUserFound(userData: any): void {
    if ('user_id' in userData) {
      // Es un beneficiario
      this.processBeneficiaryData(userData);
    } else {
      // Es un usuario
      this.processUserData(userData);
    }

    this.stateService.searchState.set({
      loading: false,
      notFound: false,
      success: true,
      error: false
    });

    // Auto-reset success message after 3 seconds
    setTimeout(() => {
      this.stateService.searchState.update(state => ({
        ...state,
        success: false
      }));
    }, 3000);
  }

  /**
   * Procesa la respuesta cuando un usuario no es encontrado
   */
  private handleUserNotFound(): void {
    const appointment = this.stateService.appointment();
    
    this.stateService.searchState.set({
      loading: false,
      notFound: true,
      success: false,
      error: false
    });

    // Reset appointment IDs
    this.stateService.userId.set('');
    this.stateService.beneficiaryId.set('');

    // Reset user data fields to allow manual entry
    this.stateService.appointment.update(app => ({
      ...app,
      user_id: '',
      beneficiary_id: '',
      userData: {
        ...app.userData,
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        image: 'beneficiary_id' in app.userData 
          ? { 
              id: 0,
              public_name: '',
              private_name: '',
              image_path: '',
              uploaded_at: '',
              beneficiary_id: ''
            } as BeneficiaryImage
          : {
              id: 0,
              public_name: '',
              private_name: '',
              image_path: '',
              uploaded_at: '',
              user_id: ''
            } as UserImage
      }
    }));
  }

  /**
   * Procesa los datos cuando el usuario encontrado es un beneficiario
   */
  private processBeneficiaryData(userData: any): void {
    this.stateService.beneficiaryId.set(userData.id.toString());
    this.stateService.userId.set(userData.user_id.toString());
    
    this.stateService.appointment.update(app => ({
      ...app,
      beneficiary_id: userData.id.toString(),
      user_id: userData.user_id.toString(),
      is_for_beneficiary: true,
      userData: {
        ...app.userData,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        email: userData.email || 'Sin correo electrónico',
        image: userData.image
          ? ({
              id: userData.image.id || 0,
              public_name: userData.image.public_name || '',
              private_name: userData.image.private_name || '',
              image_path: userData.image.image_path || '',
              uploaded_at: userData.image.uploaded_at || '',
              beneficiary_id: userData.id || ''
            } as BeneficiaryImage)
          : ({} as BeneficiaryImage),
      }
    }));
  }

  /**
   * Procesa los datos cuando el usuario encontrado es un usuario principal
   */
  private processUserData(userData: any): void {
    this.stateService.beneficiaryId.set('');
    this.stateService.userId.set(userData.id.toString());
    
    this.stateService.appointment.update(app => ({
      ...app,
      beneficiary_id: '',
      user_id: userData.id.toString(),
      is_for_beneficiary: false,
      userData: {
        ...app.userData,
        id: userData.id || 0,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        is_for_beneficiary: false,
        image: userData.image
          ? ({
              id: userData.image.id || 0,
              public_name: userData.image.public_name || '',
              private_name: userData.image.private_name || '',
              image_path: userData.image.image_path || '',
              uploaded_at: userData.image.uploaded_at || '',
              user_id: userData.id || '',
            } as UserImage)
          : ({} as UserImage),
      }
    }));
  }

  /**
   * Implementa un debounce para la búsqueda por identificación
   */
  public debounceIdentificationSearch(callback: Function, delay: number = 500): void {
    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }

    this.searchTimeoutId = setTimeout(() => {
      callback();
    }, delay);
  }
}