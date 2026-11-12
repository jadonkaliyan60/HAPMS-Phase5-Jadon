import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AppointmentService } from './appointment.service';
import { Appointment, AppointmentStatus } from '../models/appointment';

export interface AppointmentPatientDetails {
  patientId: string;
  patientName: string;
  appointment: {
    startsAt: string;
    endsAt: string;
    consultationType: string;
    status: AppointmentStatus;
    room: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly appointments = inject(AppointmentService);

  getPatientDetailsForAppointment(id: string): Observable<AppointmentPatientDetails | undefined> {
    return this.appointments.listForCurrentDoctor().pipe(
      map((appointments: Appointment[]) => {
        const visit = appointments.find(appointment => appointment.id === id);
        
        if (!visit) return undefined;
        
        const { patientId, patientName, startsAt, endsAt, consultationType, status, room } = visit;
        return {
          patientId,
          patientName,
          appointment: { startsAt, endsAt, consultationType, status, room }
        };
      })
    );
  }
}