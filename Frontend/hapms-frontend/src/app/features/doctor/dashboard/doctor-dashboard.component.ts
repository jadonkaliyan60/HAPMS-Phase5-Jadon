import { Component, computed, inject } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';

@Component({
  selector: 'app-doctor-dashboard',
  imports: [DatePipe, SlicePipe],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss'
})
export class DoctorDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  
  readonly user = this.authService.user;
  readonly doctorName = computed(() => this.user()?.fullName || 'Doctor');
  
  readonly today = new Date();
  
  readonly allAppointments = computed(() => {
    return this.appointmentService.getAppointments().filter(app => app.doctorId === this.user()?.id);
  });
  
  readonly upcomingAppointments = computed(() => {
    return this.allAppointments().filter(app => app.status === 'Scheduled');
  });
  
  readonly totalAppointments = computed(() => this.allAppointments().length);
  readonly pendingPatients = computed(() => this.upcomingAppointments().length);
  readonly completedAppointments = computed(() => {
    return this.allAppointments().filter(app => app.status === 'Completed').length;
  });

  markCompleted(id: string) {
    this.appointmentService.updateStatus(id, 'Completed');
  }

  cancelAppointment(id: string) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.updateStatus(id, 'Cancelled');
    }
  }
}