import { Component, input, computed } from '@angular/core';
import { AppointmentStatus } from '../../../core/models/appointment';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  readonly status = input.required<AppointmentStatus>();
}