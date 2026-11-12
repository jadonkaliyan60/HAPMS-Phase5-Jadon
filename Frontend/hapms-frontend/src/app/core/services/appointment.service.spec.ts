import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AppointmentService } from './appointment.service';
import { APPOINTMENT_DATA } from './appointment-data';
import { createMockAppointmentData } from '../../mocks/data/appointments';

describe('mock appointments', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [{ provide: APPOINTMENT_DATA, useFactory: createMockAppointmentData }],
    }),
  );

  it('provides two future visits and six completed visits only for the demo patient', async () => {
    const service = TestBed.inject(AppointmentService);
    const appointments = await firstValueFrom(service.listForPatient('demo-patient'));
    const upcoming = appointments.filter((appointment) => appointment.status === 'scheduled');
    const completed = appointments.filter((appointment) => appointment.status === 'completed');
    expect(upcoming).toHaveLength(2);
    expect(completed).toHaveLength(6);
    expect(upcoming.every((appointment) => Date.parse(appointment.startsAt) > Date.now())).toBe(
      true,
    );
    expect(completed.every((appointment) => Date.parse(appointment.startsAt) < Date.now())).toBe(
      true,
    );
    expect(await firstValueFrom(service.listForPatient('new-patient'))).toEqual([]);
  });

  it('persists cancellation in memory, is retry-safe and checks patient ownership', async () => {
    const service = TestBed.inject(AppointmentService);
    const initialCount = (await firstValueFrom(service.list())).length;
    await expect(
      firstValueFrom(service.cancel('mock-appointment-1', 'other-patient')),
    ).rejects.toThrow();
    await firstValueFrom(service.cancel('mock-appointment-1', 'demo-patient'));
    await firstValueFrom(service.cancel('mock-appointment-1', 'demo-patient'));
    const appointments = await firstValueFrom(service.listForPatient('demo-patient'));
    expect(appointments.filter((appointment) => appointment.status === 'scheduled')).toHaveLength(
      1,
    );
    expect(appointments[0].status).toBe('cancelled');
    expect(await firstValueFrom(service.list())).toHaveLength(initialCount);
    await expect(
      firstValueFrom(service.cancel('mock-appointment-3', 'demo-patient')),
    ).rejects.toThrow();
  });
});
