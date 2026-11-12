import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { User } from '../../../core/models/user';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-dashboard-header',
  imports: [DatePipe, IconComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
})
export class DashboardHeaderComponent {
  readonly user = input.required<User>();
  readonly page = input('Dashboard');
  readonly today = new Date();
  readonly menuOpen = input(false);
  readonly toggleNavigation = output<void>();
  readonly signOut = output<void>();
  readonly profileOpen = signal(false);
  readonly initials = computed(() => {
    const { fullName, role } = this.user();
    const name = role === 'doctor' ? fullName.replace(/^Dr\.\s+/i, '') : fullName;
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  });
}
