import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-calendar-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <button type="button" class="month-nav prev" (click)="prevMonth()">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>
        <div class="current-month">{{ getMonthYearDisplay() }}</div>
        <button type="button" class="month-nav next" (click)="nextMonth()">
          <ion-icon name="arrow-forward-outline"></ion-icon>
        </button>
      </div>

      <div class="weekdays">
        <div *ngFor="let day of weekdays" class="weekday">{{ day }}</div>
      </div>

      <div class="days">
        <div
          *ngFor="let day of calendarDays"
          class="day"
          [class.other-month]="day.otherMonth"
          [class.today]="day.isToday"
          [class.selected]="isSelected(day.date)"
          [class.disabled]="day.disabled"
          (click)="!day.disabled && selectDate(day.date)"
        >
          {{ day.dayNumber }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./calendar-selector.component.scss'],
})
export class CalendarSelectorComponent implements OnInit {
  @Input() selectedDate: string = '';
  @Input() minDate: string = '';
  @Output() dateSelected = new EventEmitter<string>();

  weekdays: string[] = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; 
  currentMonth: Date = new Date();
  calendarDays: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.initializeCalendarState();
    this.generateCalendarDays();
    this.logInitialState(); // Añadido para consistencia
  }

  private initializeCalendarState(): void {
    // Si hay una fecha seleccionada, el calendario se inicializa en ese mes.
    // De lo contrario, se usa el mes actual.
    this.currentMonth = this.selectedDate ? new Date(this.selectedDate) : new Date();
    // Asegurarse de que currentMonth no tenga en cuenta la hora para la lógica del calendario
    this.currentMonth.setHours(0, 0, 0, 0);
  }

  private logInitialState(): void {
    console.log('CalendarSelectorComponent initialized with:', {
      selectedDate: this.selectedDate,
      minDate: this.minDate,
      currentMonth: this.formatDate(this.currentMonth) 
    });
  }

  generateCalendarDays(): void {
    if (!(this.currentMonth instanceof Date) || isNaN(this.currentMonth.getTime())) {
      console.error('currentMonth no es una fecha válida para generar el calendario.');
      this.calendarDays = [];
      return;
    }

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const minDateObj = this.getMinDateObject();

    const prevMonthDays = this.getPreviousMonthDays(year, month, minDateObj);
    const currentMonthDays = this.getCurrentMonthDays(year, month, minDateObj);
    const nextMonthDays = this.getNextMonthDays(year, month, prevMonthDays.length + currentMonthDays.length);

    this.calendarDays = [
      ...prevMonthDays,
      ...currentMonthDays,
      ...nextMonthDays,
    ];
  }

  private getMinDateObject(): Date {
    const minDate = this.minDate ? new Date(this.minDate) : new Date(); // Por defecto, hoy si no hay minDate
    minDate.setHours(0, 0, 0, 0); // Normalizar a medianoche
    if (isNaN(minDate.getTime())) {
        console.warn('minDate proporcionada es inválida, usando la fecha actual como mínimo.');
        const today = new Date();
        today.setHours(0,0,0,0);
        return today;
    }
    return minDate;
  }

  private getPreviousMonthDays(year: number, month: number, minDateObj: Date): any[] {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Domingo) a 6 (Sábado)
    const days: any[] = [];

    if (firstDayOfWeek > 0) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = firstDayOfWeek; i > 0; i--) {
        const dayNumber = prevMonthLastDay - i + 1;
        const date = new Date(year, month - 1, dayNumber);
        date.setHours(0,0,0,0);
        days.push(this.createDayObject(date, dayNumber, true, minDateObj));
      }
    }
    return days;
  }

  private getCurrentMonthDays(year: number, month: number, minDateObj: Date): any[] {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const days: any[] = [];

    for (let dayNumber = 1; dayNumber <= lastDayOfMonth; dayNumber++) {
      const date = new Date(year, month, dayNumber);
      date.setHours(0,0,0,0);
      days.push(this.createDayObject(date, dayNumber, false, minDateObj));
    }
    return days;
  }

  private getNextMonthDays(year: number, month: number, currentCalendarDaysCount: number): any[] {
    const days: any[] = [];
    const totalSlots = Math.ceil(currentCalendarDaysCount / 7) * 7;
    const remainingSlots = totalSlots - currentCalendarDaysCount;

    if (remainingSlots > 0 && remainingSlots < 7) { // Asegurar que solo se añaden si es necesario para completar la semana
        for (let dayNumber = 1; dayNumber <= remainingSlots; dayNumber++) {
            const date = new Date(year, month + 1, dayNumber);
            date.setHours(0,0,0,0);
            // Para los días del mes siguiente, la deshabilitación por minDate no suele aplicarse,
            // pero se podría añadir lógica si fuera necesario.
            days.push(this.createDayObject(date, dayNumber, true, new Date(0))); // Usar una fecha muy antigua para minDate para no deshabilitarlos
        }
    }
    return days;
  }

  private createDayObject(date: Date, dayNumber: number, otherMonth: boolean, minDateObj: Date): any {
    return {
      date: this.formatDate(date),
      dayNumber,
      otherMonth,
      isToday: this.isToday(date),
      disabled: date.getTime() < minDateObj.getTime(),
    };
  }

  prevMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.generateCalendarDays();
  }

  selectDate(dateStr: string): void {
    if (!dateStr) return; // Evitar procesar si no hay fecha
    this.selectedDate = dateStr;
    this.dateSelected.emit(dateStr);
    // Opcional: Regenerar el calendario si la selección de fecha debe cambiar el mes visible
    // this.currentMonth = new Date(this.selectedDate);
    // this.generateCalendarDays(); 
  }

  isSelected(dateStr: string): boolean {
    if (!this.selectedDate || !dateStr) return false;
    return this.selectedDate === dateStr;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar la fecha de hoy para la comparación
    return date.getTime() === today.getTime();
  }

  getMonthYearDisplay(): string {
    if (!(this.currentMonth instanceof Date) || isNaN(this.currentMonth.getTime())) {
      console.warn('currentMonth no es una fecha válida para getMonthYearDisplay');
      return 'Mes Año'; // Valor por defecto o manejo de error
    }
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC' // Especificar timezone para consistencia si es necesario
    };
    try {
      const monthYear = this.currentMonth.toLocaleDateString('es-ES', options);
      return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    } catch (error) {
      console.error('Error al formatear mes y año:', error);
      return 'Error de Fecha';
    }
  }

  private formatDate(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Se intentó formatear una fecha inválida:', date);
      return ''; // O manejar el error como se prefiera
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
