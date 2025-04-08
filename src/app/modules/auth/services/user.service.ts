import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';
import { User } from 'src/app/core/interfaces/auth.interface';
import { UserHealthService } from 'src/app/core/services/user-health.service';
import { environment } from 'src/environments/environment';

export let appInjector: Injector;

@Injectable({ providedIn: 'root' })
export class UserService {
  private userSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage()
  );

  public user$: Observable<User | null> = this.userSubject.asObservable();
  private baseUrl = environment.url;

  constructor(private http: HttpClient) {}

  setUser(userData: User) {
    this.userSubject.next(userData);
    // Ensure localStorage is updated when user is set
    localStorage.setItem('user', JSON.stringify(userData));
  }

  private getUserFromStorage(): User | null {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  findByIdentification(
    identificationType: string,
    identificationNumber: string
  ): Observable<User | null> {
    if (!identificationType || !identificationNumber) {
      return of(null);
    }

    const url = `${this.baseUrl}api/user/identification/${identificationType}/${identificationNumber}`;

    return this.http.get<User>(url).pipe(
      map((response: any) => {
        const userData = response.data || response;
        return userData;
      }),
      catchError((error) => {
        console.error('Error fetching user by identification:', error);
        return of(null);
      })
    );
  }

  /**
   * Refreshes user data by fetching the latest from the server
   * @param userId The ID of the user to refresh
   * @returns Observable of the user data
   */
  refreshUserData(userId: number): Observable<any> {
    const apiUrl = `${this.baseUrl}api/users/profile`;

    return this.http.get(apiUrl).pipe(
      tap((response: any) => {
        if (response && response.data) {
          const userData = response.data;

          // Ensure location data is properly structured
          if (
            userData.location &&
            Array.isArray(userData.location) &&
            userData.location.length > 0
          ) {
            // If location is an array, use the first element for consistency
            userData.location = userData.location[0] || userData.location;
          }

          // Update the BehaviorSubject with the fresh data
          this.userSubject.next(userData);

          // Update localStorage
          localStorage.setItem('user', JSON.stringify(userData));

        }
      }),
      map((response) => response.data),
      catchError((error) => {
        console.error('Error refreshing user data:', error);
        return throwError(
          () => new Error(error.message || 'Error refreshing user data')
        );
      })
    );
  }

  updateUserWithHealthData(healthData: any): void {
    const currentUser = this.userSubject.getValue();

    if (!currentUser) {
      return;
    }

    let updatedUser: User;
    if (Array.isArray(currentUser)) {
      updatedUser = {
        ...currentUser[0],
        health: healthData,
      };
    } else {
      updatedUser = {
        ...currentUser,
      };
    }

    this.userSubject.next(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }

  updateProfile(userData: any): Observable<any> {
    const apiUrl = `${this.baseUrl}api/user/update/${userData.id}`;

    return this.http.put(apiUrl, userData).pipe(
      tap((response: any) => {
        if (response && response.data) {

          // Get the current user from storage
          const currentUser = this.getUserFromStorage();

          // Create the updated user object by merging current user with response data
          let updatedUser: User;

          if (Array.isArray(currentUser)) {
            updatedUser = {
              ...currentUser[0],
              ...response.data,
            };
          } else {
            updatedUser = {
              ...currentUser,
              ...response.data,
            };
          }

          // // Ensure location data is properly structured
          // if (response.data.location && Array.isArray(response.data.location)) {
          //   updatedUser.location =
          //     response.data.location[0] || response.data.location;
          // }

          // Update the BehaviorSubject with the complete merged data
          this.userSubject.next(updatedUser);

          // Update localStorage with the merged user data
          localStorage.setItem('user', JSON.stringify(updatedUser));

        }
      }),
      catchError((error) => {
        console.error('Error updating user profile:', error);
        return throwError(
          () => new Error(error.message || 'Error updating profile')
        );
      })
    );
  }
  getUser(): User | null {
    return this.userSubject.value;
  }

  clearUser() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }

  getUserHealthData() {
    const userHealthService = appInjector.get(UserHealthService);
    userHealthService.getUserHealthData();
  }
}
