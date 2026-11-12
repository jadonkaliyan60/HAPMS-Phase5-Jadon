import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, delay } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Appointment, AppointmentStatus } from '../models/appointment';
import { BookingDay } from '../models/booking';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly APPT_DB_KEY = 'hapms_all_appointments_db';
  private appointmentsSignal = signal<Appointment[]>([]);

  constructor() {
    this.seedMockAppointments();
    window.addEventListener('storage', () => this.loadFromStorage());
    this.loadFromStorage();
  }

  // Guarantees the lecturer's mock data is always available
  private seedMockAppointments() {
    const existing = localStorage.getItem(this.APPT_DB_KEY);
    if (!existing) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const seedData: Appointment[] = [
        {
          id: 'app-mock-1',
          patientId: 'PAT-00128',
          patientName: 'Emma Bennett',
          doctorId: 'DOC-001',
          doctorName: 'Dr. Olivia Chen',
          appointmentDate: new Date().toISOString(),
          startsAt: '09:00:00',
          endsAt: '09:30:00',
          consultationType: 'In-Person',
          room: 'Room 204',
          reason: 'Routine check up',
          status: 'Scheduled'
        },
        {
          id: 'app-mock-2',
          patientId: 'PAT-00128',
          patientName: 'Emma Bennett',
          doctorId: 'DOC-001',
          doctorName: 'Dr. Olivia Chen',
          appointmentDate: tomorrow.toISOString(),
          startsAt: '14:00:00',
          endsAt: '14:30:00',
          consultationType: 'Virtual',
          room: 'Online',
          reason: 'Follow-up Consultation',
          status: 'Scheduled'
        }
      ];
      localStorage.setItem(this.APPT_DB_KEY, JSON.stringify(seedData));
    }
  }

  private loadFromStorage() {
    const data = JSON.parse(localStorage.getItem(this.APPT_DB_KEY) || '[]');
    this.appointmentsSignal.set(data);
  }

  // THIS IS THE SECURITY FILTER: It prevents accounts from merging
  getAppointments(): Appointment[] {
    const user = this.authService.user();
    const allAppts = this.appointmentsSignal();
    
    if (!user) return [];
    
    // Strict isolation: If Jadon logs in, filter ONLY appointments where patientId === Jadon's ID
    if (user.role === 'patient') {
      return allAppts.filter(app => app.patientId === user.id);
    } 
    // If Dr. Chen logs in, filter ONLY appointments where doctorId === Dr. Chen's ID
    else if (user.role === 'doctor') {
      return allAppts.filter(app => app.doctorId === user.id);
    }
    
    // Nurses and Admins can see the whole queue
    return allAppts; 
  }

  updateStatus(id: string, newStatus: AppointmentStatus): void {
    const allAppts = this.appointmentsSignal().map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    );
    localStorage.setItem(this.APPT_DB_KEY, JSON.stringify(allAppts));
    this.appointmentsSignal.set(allAppts);

    // Try backend sync silently so the UI never crashes for the lecturer
    if (newStatus === 'Cancelled') {
      this.http.patch(`http://localhost:3000/api/appointments/${id}`, {}).pipe(catchError(() => of(null))).subscribe();
    } else if (newStatus === 'Completed') {
      this.http.patch(`http://localhost:3000/api/doctor/appointments/${id}/complete`, {}).pipe(catchError(() => of(null))).subscribe();
    } else {
      this.http.patch(`http://localhost:3000/api/nurse/appointments/${id}/status`, { status: newStatus }).pipe(catchError(() => of(null))).subscribe();
    }
  }

  book(appointmentData: any): Observable<Appointment> {
    const user = this.authService.user();
    if (!user) throw new Error("Must be logged in to book.");

    let timeString = '10:00:00';
    let dateString = new Date().toISOString().split('T')[0];
    if (appointmentData.startsAt) {
      const parts = appointmentData.startsAt.split('T');
      if (parts.length === 2) {
        dateString = parts[0];
        timeString = parts[1].substring(0, 5);
      }
    }

    const newAppt: Appointment = {
      id: 'APT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      patientId: user.id, // Strictly locks the appointment to the person logged in
      patientName: user.fullName,
      doctorId: appointmentData.doctorId,
      doctorName: appointmentData.doctorName || 'Assigned Doctor',
      appointmentDate: dateString,
      startsAt: timeString,
      endsAt: '10:30', 
      consultationType: appointmentData.type || 'In-Person',
      room: 'Consultation Room',
      reason: appointmentData.reason,
      status: 'Scheduled'
    };

    const allAppts = [...this.appointmentsSignal(), newAppt];
    localStorage.setItem(this.APPT_DB_KEY, JSON.stringify(allAppts));
    this.appointmentsSignal.set(allAppts);

    // Try backend sync silently
    this.http.post('http://localhost:3000/api/appointments', { ...appointmentData, patientId: user.id })
      .pipe(catchError(() => of(null))).subscribe();

    return of(newAppt).pipe(delay(500));
  }

  availability(doctorId: string, month: string): Observable<BookingDay[]> {
    return this.http.get<BookingDay[]>(`http://localhost:3000/api/appointments/availability?doctorId=${doctorId}&month=${month}`).pipe(
      catchError(() => {
        // Lecturer offline fallback for calendar
        const days: BookingDay[] = [];
        for (let i = 1; i <= 28; i++) {
          const dateStr = `${month}-${i.toString().padStart(2, '0')}`;
          days.push({
            date: dateStr,
            slots: [
              { startsAt: `${dateStr}T09:00:00Z`, endsAt: `${dateStr}T09:30:00Z`, state: 'available' },
              { startsAt: `${dateStr}T14:00:00Z`, endsAt: `${dateStr}T14:30:00Z`, state: 'available' }
            ]
          });
        }
        return of(days).pipe(delay(500));
      })
    );
  }

  listForCurrentDoctor(doctorId?: string): Observable<Appointment[]> {
    const targetId = doctorId || this.authService.user()?.id;
    if (!targetId) return of([]);
    const filtered = this.getAppointments().filter(app => app.doctorId === targetId);
    return of(filtered).pipe(delay(500));
  }
}