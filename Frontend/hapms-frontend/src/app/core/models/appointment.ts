export type AppointmentStatus = 
  | 'Scheduled' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Checked-In'
  | 'In Triage'
  | 'Ready for Doctor'
  | 'Pending' 
  | 'No-Show' 
  | 'Rescheduled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  startsAt: string;
  endsAt: string;
  consultationType: string;
  room: string;
  reason: string;
  status: AppointmentStatus;
  speciality?: string;
}