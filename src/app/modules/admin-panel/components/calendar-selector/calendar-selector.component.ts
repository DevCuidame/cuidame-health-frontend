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
    if (this.selectedDate) {
      this.currentMonth = new Date(this.selectedDate);
    }
    this.generateCalendarDays();
  }


  generateCalendarDays(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();

    const minDateObj = this.minDate ? new Date(this.minDate) : new Date();
    minDateObj.setHours(0, 0, 0, 0);

    const prevMonthDays = [];
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthLastDay = prevMonth.getDate();

      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        prevMonthDays.push({
          date: this.formatDate(date),
          dayNumber: day,
          otherMonth: true,
          isToday: this.isToday(date),
          disabled: date < minDateObj,
        });
      }
    }

    const currentMonthDays = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      currentMonthDays.push({
        date: this.formatDate(date),
        dayNumber: day,
        otherMonth: false,
        isToday: this.isToday(date),
        disabled: date < minDateObj,
      });
    }

    const nextMonthDays = [];
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const daysNeeded = Math.ceil(totalDays / 7) * 7;
    const remainingDays = daysNeeded - totalDays;

    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      nextMonthDays.push({
        date: this.formatDate(date),
        dayNumber: day,
        otherMonth: true,
        isToday: this.isToday(date),
        disabled: false,
      });
    }

    this.calendarDays = [
      ...prevMonthDays,
      ...currentMonthDays,
      ...nextMonthDays,
    ];
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
    this.selectedDate = dateStr;
    this.dateSelected.emit(dateStr);
  }

  isSelected(dateStr: string): boolean {
    return this.selectedDate === dateStr;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  getMonthYearDisplay(): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };
    const monthYear = this.currentMonth.toLocaleDateString('es-ES', options);
    return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
