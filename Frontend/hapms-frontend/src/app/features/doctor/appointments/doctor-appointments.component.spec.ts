import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/auth/auth.service';
import { APPOINTMENT_DATA } from '../../../core/services/appointment-data';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { createMockAppointmentData } from '../../../mocks/data/appointments';

describe('doctor appointment management', () => {
  const reason = 'Fictional private reason';
  beforeEach(() => {
    vi.setSystemTime(new Date('2027-01-06T08:15:00Z'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: APPOINTMENT_DATA, useFactory: createMockAppointmentData },
      ],
    });
  });
  afterEach(() => vi.useRealTimers());

  it('protects details and transitions, and reflects confirmed changes in both portals', async () => {
    const auth = TestBed.inject(AuthService);
    const service = TestBed.inject(AppointmentService);
    const patients = TestBed.inject(PatientService);
    const login = (role: 'patient' | 'doctor') =>
      firstValueFrom(auth.login(role + '@hapms.demo', 'Demo123!', false));

    await login('patient');
    const visit = await firstValueFrom(
      service.book({
        department: 'General Medicine',
        doctorId: 'mock-doctor-chen',
        startsAt: '2027-01-06T08:30:00Z',
        reason,
      }),
    );
    await expect(firstValueFrom(patients.detailsForDoctorAppointment(visit.id))).rejects.toThrow(
      'Sign in as a doctor',
    );
    await expect(
      firstValueFrom(service.updateDoctorOutcome(visit.id, 'completed')),
    ).rejects.toThrow('Sign in as a doctor');
    const harness = await RouterTestingHarness.create('/doctor/appointments');
    expect(TestBed.inject(Router).url).toBe('/patient/dashboard');
    auth.logout();
    await harness.navigateByUrl('/login');
    await login('doctor');
    await expect(
      firstValueFrom(patients.detailsForDoctorAppointment('mock-appointment-2')),
    ).rejects.toThrow('unavailable');
    await expect(
      firstValueFrom(service.updateDoctorOutcome('mock-appointment-2', 'completed')),
    ).rejects.toThrow('not assigned');
    await expect(
      firstValueFrom(service.updateDoctorOutcome(visit.id, 'completed')),
    ).rejects.toThrow('started');
    vi.setSystemTime(new Date(visit.endsAt!));
    await expect(firstValueFrom(service.updateDoctorOutcome(visit.id, 'no-show'))).rejects.toThrow(
      'end time',
    );
    vi.setSystemTime(new Date('2027-01-06T10:01:00Z'));

    await harness.navigateByUrl('/doctor/appointments');
    const view = harness.routeNativeElement!;
    expect(view.querySelector('[aria-current="page"][href="/doctor/appointments"]')).toBeTruthy();
    const date = view.querySelector<HTMLInputElement>('#schedule-date')!;
    expect(date.value).toBe('2027-01-06');
    const selectDate = (value: string) => {
      date.value = value;
      date.dispatchEvent(new Event('change'));
      harness.detectChanges();
    };
    const rows = () => Array.from(view.querySelectorAll('tbody tr'));
    const visitRow = () =>
      rows().find(
        (row) =>
          row.querySelector('time')?.dateTime === visit.startsAt &&
          row.textContent?.includes('Emma Bennett'),
      )!;
    const dates = rows().map((row) => row.querySelector('time')!.dateTime);
    expect(dates).toEqual([...dates].sort());
    selectDate('2027-01-07');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Emma Bennett');
    selectDate('2027-01-09');
    expect(view.textContent).toContain('No appointments are scheduled');
    selectDate('2027-01-06');

    const dialog = view.querySelector<HTMLDialogElement>('dialog')!;
    // jsdom does not implement native dialog methods.
    dialog.showModal = () => {
      dialog.open = true;
    };
    dialog.close = () => {
      dialog.open = false;
      dialog.dispatchEvent(new Event('close'));
    };
    visitRow().querySelector('button')!.click();
    harness.detectChanges();
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('demo-patient');
    expect(dialog.textContent).not.toContain(reason);
    dialog.close();

    const [complete] = Array.from(visitRow().querySelectorAll('button')).slice(1);
    complete.click();
    harness.detectChanges();
    expect(dialog.textContent).toContain('Mark appointment completed?');
    expect(visitRow().textContent).toContain('Confirmed');
    dialog.querySelector<HTMLButtonElement>('.confirm')!.click();
    harness.detectChanges();
    expect(visitRow().querySelector('app-status-badge')?.textContent).toContain('Completed');
    expect(visitRow().querySelectorAll('[aria-disabled="true"]')).toHaveLength(2);
    await expect(firstValueFrom(service.updateDoctorOutcome(visit.id, 'no-show'))).rejects.toThrow(
      'Only confirmed or pending',
    );

    const noShow = await firstValueFrom(
      service.updateDoctorOutcome('doctor-demo-visit-5', 'no-show'),
    );
    expect(noShow.status).toBe('no-show');
    await harness.navigateByUrl('/doctor/dashboard');
    expect(harness.routeNativeElement?.textContent).toContain('No-show');
    const completedCard = Array.from(
      harness.routeNativeElement!.querySelectorAll('app-stat-card'),
    )[1];
    expect(completedCard.querySelector('strong')?.textContent).toBe('3');

    auth.logout();
    await harness.navigateByUrl('/login');
    await login('patient');
    await harness.navigateByUrl('/patient/dashboard');
    const history = harness.routeNativeElement?.querySelector('tbody');
    expect(history?.textContent).toContain('06 Jan 2027');
    expect(
      (await firstValueFrom(service.listForPatient('demo-patient'))).find(
        (record) => record.id === visit.id,
      )?.status,
    ).toBe('completed');
  });
});
