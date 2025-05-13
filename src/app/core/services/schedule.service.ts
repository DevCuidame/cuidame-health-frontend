import { Injectable } from '@angular/core';

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DaySchedule {
  day: string;
  date: string;
  formatted_date: string;
  hours: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  constructor() {}

  /**
   * Convierte la disponibilidad del profesional en un formato estandarizado
   */
  public processProfessionalAvailability(availability: any): DaySchedule[] {
    if (!availability) {
      return [];
    }

    return Object.entries(availability)
      .filter(([_, range]: [string, any]) => range.start && range.end)
      .map(([day, range]: [string, any]) => ({
        day: range.formatted_date,
        date: range.date,
        formatted_date: range.formatted_date,
        hours: this.generateTimeSlots(range.start, range.end),
      }));
  }

  public getTodayFormatted(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Genera intervalos de 30 minutos entre una hora de inicio y fin
   */
  public generateTimeSlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const start = new Date(`2025-01-01T${startTime}`);
    const end = new Date(`2025-01-01T${endTime}`);

    if (start >= end) {
      console.warn(`Rango de tiempo inválido: ${startTime} - ${endTime}`);
      return slots;
    }

    while (start < end) {
      slots.push(start.toTimeString().split(' ')[0].slice(0, 5)); // HH:mm
      start.setMinutes(start.getMinutes() + 30);
    }

    return slots;
  }

  /**
   * Formatea la fecha para mostrar al usuario
   */
  public formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch (e) {
      console.error('Error formatting date', e);
      return dateStr;
    }
  }

  /**
   * Obtiene el día de la semana formateado
   */
  public getDayOfWeek(dateStr: string): string {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { weekday: 'long' });
    } catch (e) {
      console.error('Error getting day of week', e);
      return '';
    }
  }

  /**
   * Formatea la hora para mostrar al usuario
   */
  public formatTimeForDisplay(timeStr: string): string {
    if (!timeStr) return '';

    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
      return timeStr;
    }

    try {
      return timeStr.split(':').slice(0, 2).join(':');
    } catch (e) {
      console.error('Error formatting time', e);
      return timeStr;
    }
  }

  /**
   * Verifica si un slot específico está disponible (para futuras implementaciones)
   */
  public isSlotAvailable(
    date: string,
    time: string,
    professionalId: string
  ): boolean {
    // Implementar la lógica para verificar contra un backend si el slot sigue disponible
    // Por ahora, simplemente devuelve true
    return true;
  }
}
