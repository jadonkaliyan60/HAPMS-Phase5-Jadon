import { Component, computed, inject } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment.service';
import { AppointmentStatus } from '../../core/models/appointment';

@Component({
  selector: 'app-nurse-dashboard',
  imports: [DatePipe, SlicePipe],
  templateUrl: './nurse-dashboard.html',
  styleUrl: './nurse-dashboard.scss'
})
export class NurseDashboard {
  private readonly appointmentService = inject(AppointmentService);
  
  readonly today = new Date();
  
  readonly triageQueue = computed(() => {
    return this.appointmentService.getAppointments();
  });

  updateStatus(id: string, status: AppointmentStatus) {
    this.appointmentService.updateStatus(id, status);
  }

  cancelAppointment(id: string) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.updateStatus(id, 'Cancelled');
    }
  }
}