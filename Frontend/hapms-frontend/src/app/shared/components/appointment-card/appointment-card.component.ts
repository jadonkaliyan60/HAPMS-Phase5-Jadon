import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Appointment } from '../../../core/models/appointment';
import { IconComponent } from '../icon/icon.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-appointment-card',
  imports: [DatePipe, IconComponent, StatusBadgeComponent],
  templateUrl: './appointment-card.component.html',
  styleUrl: './appointment-card.component.scss',
})
export class AppointmentCardComponent {
  readonly appointment = input.required<Appointment>();
  readonly disabled = input(false);
  readonly reschedule = output<void>();
  readonly cancel = output<void>();
  readonly initials = computed(() =>
    (this.appointment().doctorName ?? 'Doctor')
      .replace(/^Dr\.\s*/, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0])
      .join(''),
  );
}
