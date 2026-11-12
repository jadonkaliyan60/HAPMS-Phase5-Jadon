import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';

@Component({
  selector: 'app-doctor-appointments',
  imports: [DatePipe, SlicePipe],
  templateUrl: './doctor-appointments.component.html',
  styleUrl: './doctor-appointments.component.scss'
})
export class DoctorAppointmentsComponent {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  
  readonly filterMode = signal<'today' | 'week' | 'month' | 'upcoming'>('upcoming');
  
  readonly myAppointments = computed(() => {
    const doctorId = this.authService.user()?.id;
    return this.appointmentService.getAppointments().filter(app => app.doctorId === doctorId);
  });
  
  readonly filteredAppointments = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.myAppointments().filter(app => {
      if (app.status === 'Cancelled' || app.status === 'Completed') return false;
      
      const apptDate = new Date(app.appointmentDate);
      apptDate.setHours(0, 0, 0, 0);
      
      if (this.filterMode() === 'today') {
        return apptDate.getTime() === today.getTime();
      }
      if (this.filterMode() === 'week') {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);
        return apptDate >= today && apptDate <= endOfWeek;
      }
      if (this.filterMode() === 'month') {
        return apptDate.getMonth() === today.getMonth() && apptDate.getFullYear() === today.getFullYear();
      }
      
      return apptDate >= today;
    }).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  });

  setFilter(mode: 'today' | 'week' | 'month' | 'upcoming') {
    this.filterMode.set(mode);
  }

  markCompleted(id: string) {
    this.appointmentService.updateStatus(id, 'Completed');
  }
}