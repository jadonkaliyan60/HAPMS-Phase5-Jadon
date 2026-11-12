export interface BookingRequest {
  readonly department: string;
  readonly doctorId: string;
  readonly startsAt: string;
  readonly reason: string;
}

export interface AppointmentSlot {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly state: 'available' | 'booked' | 'unavailable';
}

export interface BookingDay {
  readonly date: string;
  readonly slots: readonly AppointmentSlot[];
}

export const VISIT_REASON_LIMIT = 500;
