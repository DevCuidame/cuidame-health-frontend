import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Appointment, AppointmentResponse } from '../../interfaces/appointment.interface';
import { ApiResponse } from '../emergency-contacts.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private cacheKey = 'appointmentCache';
  public appointments = signal<Appointment[]>([]);
  public api = environment.url;

  constructor(private http: HttpClient) {
    this.loadFromCache();
  }

  private saveToCache(data: Appointment[]): void {
    this.appointments.set(data);
    localStorage.setItem(this.cacheKey, JSON.stringify(data));
  }

  private loadFromCache(): void {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (cachedData) {
      this.appointments.set(JSON.parse(cachedData));
    }
  }

  // En appointment.service.ts
cancelAppointment(id: number): Observable<any> {
  return this.http
    .post(`${this.api}api/patient/appointments/${id}/cancel`, {
      reason: 'personal', 
      reasonDetails: 'Cancelada por el cuidador'
    })
    .pipe(
      tap((response: any) => {
        if (response.success) {
          // Actualizar cache local
          const updatedAppointments = this.appointments().map(appt =>
            appt.id === id ? { ...appt, status: 'cancelled' } : appt
          );
          this.appointments.set(updatedAppointments);
          this.saveToCache(updatedAppointments);
        }
      }),
      catchError((error) => {
        console.error('Error al cancelar la cita:', error);
        return of({ success: false, message: 'Error al cancelar la cita' });
      })
    );
}

  createAppointment(appointment: Appointment): Observable<any> {
    console.log("🚀 ~ AppointmentService ~ createAppointment ~ appointment:", appointment)
    appointment.status = 'confirmed';
    const endpoint = `${this.api}api/appointments/`;

    return this.http.post<AppointmentResponse>(endpoint, appointment).pipe(
      tap((response) => {
        if (response && response.data) {
          this.appointments.set([...this.appointments(), response.data]);
        }
      }),
      catchError((error) => {
        console.error('Error al crear cita:', error);
        return of({
          message: 'Error al crear la cita',
          data: appointment,
          statusCode: 500,
        } as AppointmentResponse);
      })
    );
  }

  /**
   * Actualiza una cita existente en el backend
   */
  updateAppointment(
    id: number,
    appointment: Partial<Appointment>
  ): Observable<any> {

    return this.http
      .put<AppointmentResponse>(
        `${this.api}api/appointments/${id}`,
        appointment
      )
      .pipe(
        tap((response) => {
          if (response && response.data) {
            const updatedAppointments = this.appointments().map((appt) =>
              appt.id === id ? { ...appt, ...response.data } : appt
            );
            this.appointments.set(updatedAppointments);
          }
        }),
        catchError((error) => {
          return of({
            message: 'Error al actualizar la cita',
            data: appointment as Appointment,
            statusCode: 500,
          } as AppointmentResponse);
        })
      );
  }

  /**
   * Obtener todas las citas pendientes por confirmar (para agentes de call center)
   */
  getPendingAppointments(): Observable<Appointment[]> {
    return this.http
      .get<{ data: Appointment[] }>(
        `${this.api}api/medical-appointment/pending`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error al obtener citas pendientes:', error);
          return of([]);
        })
      );
  }

  updateAppointmentStatus(id: number, status: any): Observable<any> {
    return this.http
      .put<AppointmentResponse>(
        `${this.api}api/medical-appointment/status/${id}`,
        { status }
      )
      .pipe(
        tap((response) => {
          if (response && response.data) {
            const updatedAppointments = this.appointments().map((appt) =>
              appt.id === id ? { ...appt, status: status } : appt
            );
            this.appointments.set(updatedAppointments);
            this.saveToCache(updatedAppointments);
          }
        }),
        catchError((error) => {
          console.error('Error al actualizar estado de la cita:', error);
          return of({
            message: 'Error al actualizar estado de la cita',
            statusCode: 500,
          });
        })
      );
  }


  getAppointmentsList(): void {
    this.http
      .get<{ data: any[] }>(
        `${this.api}api/patient/appointments/all`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error al obtener todas las citas:', error);
          return of([]);
        })
      )
      .subscribe((appointments) => {
        if (appointments && appointments.length > 0) {
          this.updateAppointments(appointments);
        }
      });
  }

   /**
   * Obtiene detalles de una cita específica
   * @param appointmentId ID de la cita
   */
   getAppointmentDetails(appointmentId: number): Observable<ApiResponse<Appointment>> {
    return this.http.get<ApiResponse<Appointment>>(`${this.api}patient/appointments/${appointmentId}`);
  }

  getAllAppointments(): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.api}api/patient/appointments/all`);
  }

  /**
   * Busca citas en el backend usando filtros
   * @param searchTerm Término de búsqueda
   * @param filters Filtros adicionales (especialidad, estado, etc.)
   */
  searchAppointments(searchTerm: string, filters?: any): Observable<ApiResponse<Appointment[]>> {
    const params: any = {};
    
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    if (filters) {
      Object.assign(params, filters);
    }

    return this.http.get<ApiResponse<Appointment[]>>(`${this.api}api/appointments/search`, {
      params
    }).pipe(
      catchError((error) => {
        console.error('Error al buscar citas:', error);
        return of({ data: [], message: 'Error en la búsqueda', statusCode: 500, success: false } as ApiResponse<Appointment[]>);
      })
    );
  }

  clearCache(): void {
    this.appointments.set([]);
    localStorage.removeItem(this.cacheKey);
  }

  public updateAppointments(appointmentList: Appointment[]): void {
    this.appointments.set(appointmentList);
    this.saveToCache(appointmentList);
  }

  addAppointment(appointment: Appointment): void {
    const currentAppointments = this.appointments();
    const updated = [...currentAppointments, appointment];
    this.appointments.set(updated);
    this.saveToCache(updated);
  }

  processAppointmentDates(appointments: Appointment[]): Appointment[] {
    return appointments.map((appointment) => {
      // Skip processing if appointment date is null
      if (!appointment.start_time) {
        return {
          ...appointment,
          appointment_date_formatted: 'Fecha por definir',
          appointment_time_formatted: 'Hora por definir',
          day: '',
        };
      }

      try {
        const appDate = new Date(appointment.start_time);

        // Format the date
        const formattedDate = appDate.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        // Get day of week
        const dayOfWeek = appDate.toLocaleDateString('es-ES', {
          weekday: 'long',
        });

        // Format time (if exists)
        let formattedTime = appointment.start_time || 'Hora por definir';
        if (formattedTime && formattedTime.length >= 5) {
          formattedTime = formattedTime.substring(0, 5);
        }

        return {
          ...appointment,
          appointment_date_formatted: formattedDate,
          appointment_time_formatted: formattedTime,
          day: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
        };
      } catch (error) {
        console.error('Error processing appointment date:', error);
        return appointment;
      }
    });
  }
}
