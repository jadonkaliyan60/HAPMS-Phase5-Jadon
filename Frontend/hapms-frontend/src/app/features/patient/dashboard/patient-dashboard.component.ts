import { Component, computed, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';

@Component({
  selector: 'app-patient-dashboard',
  imports: [DatePipe],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent implements OnInit {
  private readonly titleService = inject(Title);
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);

  readonly user = this.authService.user;
  readonly patientName = computed(() => this.user()?.fullName || 'Patient');

  readonly myAppointments = computed(() => {
    return this.appointmentService.getAppointments().filter(app => app.patientId === this.user()?.id);
  });

  readonly totalVisits = computed(() => this.myAppointments().length);
  readonly upcomingVisits = computed(() => {
    return this.myAppointments().filter(app => app.status === 'Scheduled').length;
  });
  readonly completedVisits = computed(() => {
    return this.myAppointments().filter(app => app.status === 'Completed').length;
  });

  ngOnInit() {
    this.titleService.setTitle('Patient Portal - HAPMS');
  }

  cancelAppointment(id: string) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.updateStatus(id, 'Cancelled');
    }
  }
}