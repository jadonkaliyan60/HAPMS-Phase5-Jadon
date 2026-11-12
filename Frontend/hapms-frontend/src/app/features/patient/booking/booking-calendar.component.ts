import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { BookingDay } from '../../../core/models/booking';
import { calendarDate, dateKey } from '../../../core/services/booking-dates';

@Component({
  selector: 'app-booking-calendar',
  imports: [DatePipe],
  templateUrl: './booking-calendar.component.html',
  styleUrl: './booking-calendar.component.scss',
})
export class BookingCalendarComponent {
  readonly month = input.required<string>();
  readonly today = input.required<string>();
  readonly days = input.required<readonly BookingDay[]>();
  readonly selected = input.required<string>();
  readonly monthChange = output<string>();
  readonly dateChange = output<string>();
  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly cells = computed(() => {
    const [year, month] = this.month().split('-').map(Number);
    const first = calendarDate(year, month - 1, 1);
    const leading = (first.getUTCDay() + 6) % 7;
    const count = calendarDate(year, month, 0).getUTCDate();
    const dates = new Set(
      this.days()
        .filter((day) => day.slots.some((slot) => slot.state === 'available'))
        .map((day) => day.date),
    );
    return Array.from({ length: Math.ceil((leading + count) / 7) * 7 }, (_, index) => {
      const date = calendarDate(year, month - 1, index - leading + 1);
      const key = dateKey(date);
      const inMonth = key.startsWith(this.month());
      return {
        key,
        day: date.getUTCDate(),
        available: inMonth && key >= this.today() && dates.has(key),
      };
    });
  });

  changeMonth(offset: number): void {
    const [year, month] = this.month().split('-').map(Number);
    const next = dateKey(calendarDate(year, month - 1 + offset, 1)).slice(0, 7);
    if (next >= this.today().slice(0, 7)) this.monthChange.emit(next);
  }
}
