import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/auth/auth.service';
import { APPOINTMENT_DATA } from '../../../core/services/appointment-data';
import { AppointmentService } from '../../../core/services/appointment.service';
import { createMockAppointmentData } from '../../../mocks/data/appointments';

describe('patient booking', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2027-01-06T06:00:00Z'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: APPOINTMENT_DATA, useFactory: createMockAppointmentData },
      ],
    });
  });
  afterEach(() => vi.useRealTimers());

  it('guards booking and blocks booking writes for non-patients', async () => {
    const harness = await RouterTestingHarness.create('/patient/book-appointment');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/login');
    await firstValueFrom(TestBed.inject(AuthService).login('doctor@hapms.demo', 'Demo123!', false));
    await harness.navigateByUrl('/patient/book-appointment');
    expect(router.url).toBe('/doctor/dashboard');
    await expect(
      firstValueFrom(
        TestBed.inject(AppointmentService).book({
          department: 'General Medicine',
          doctorId: 'mock-doctor-chen',
          startsAt: '2027-01-06T07:00:00.000Z',
          reason: 'Fictional visit',
        }),
      ),
    ).rejects.toThrow('Sign in as a patient');
  });

  it('books through the form, rejects repeat writes and updates the dashboard and cancellation', async () => {
    await firstValueFrom(
      TestBed.inject(AuthService).login('patient@hapms.demo', 'Demo123!', false),
    );
    const harness = await RouterTestingHarness.create('/patient/book-appointment');
    const view: HTMLElement = harness.routeNativeElement!;
    const service = TestBed.inject(AppointmentService);
    const choose = (index: number, value: string) => {
      const select = view.querySelectorAll('select')[index];
      select.value = value;
      select.dispatchEvent(new Event('change'));
      harness.detectChanges();
    };
    const click = (selector: string) => {
      view.querySelector<HTMLButtonElement>(selector)!.click();
      harness.detectChanges();
    };
    const setReason = (text: string) => {
      const field = view.querySelector('textarea')!;
      field.value = text;
      field.dispatchEvent(new Event('input'));
      field.dispatchEvent(new Event('blur'));
      harness.detectChanges();
    };
    expect(view.querySelector('nav[aria-label="Breadcrumb"] strong')?.textContent).toBe(
      'Book Appointment',
    );
    expect(
      view.querySelector('[aria-current="page"][href="/patient/book-appointment"]'),
    ).toBeTruthy();
    expect(view.querySelector<HTMLButtonElement>('.confirm')!.disabled).toBe(true);
    choose(0, 'General Medicine');
    choose(1, 'mock-doctor-chen');
    click('[aria-label="Thursday, 7 January 2027"]');
    expect(view.querySelector<HTMLButtonElement>('[aria-label="09:30, booked"]')!.disabled).toBe(
      true,
    );
    click('[aria-label="09:00, available"]');
    choose(1, 'mock-doctor-patel');
    expect(view.textContent).toContain('45-minute consultation');
    expect(view.textContent).toContain('Choose a time');
    choose(0, 'Cardiology');
    expect(
      Array.from(view.querySelectorAll('select')[1].options).map((option) => option.value),
    ).toEqual(['', 'mock-doctor-wilson']);
    expect(view.querySelectorAll('select')[1].value).toBe('');
    choose(0, 'General Medicine');
    choose(1, 'mock-doctor-chen');
    click('[aria-label="Wednesday, 6 January 2027"]');
    click('[aria-label="09:00, available"]');
    setReason('   ');
    expect(view.querySelector<HTMLButtonElement>('.confirm')!.disabled).toBe(true);
    expect(view.querySelector('#reason-error')?.textContent).toContain('Enter a reason');
    setReason('Fictional check-up');
    expect(view.querySelector<HTMLButtonElement>('.confirm')!.disabled).toBe(false);
    click('.confirm');
    click('.confirm');
    expect(view.querySelector('.confirmation')?.textContent).toContain('Booking confirmed');
    const appointments = await firstValueFrom(service.listForPatient('demo-patient'));
    const booked = appointments.find((appointment) => appointment.reason === 'Fictional check-up')!;
    expect(booked.department).toBe('General Medicine');
    expect(booked.endsAt).toBe('2027-01-06T07:30:00.000Z');
    await expect(
      firstValueFrom(
        service.book({
          department: 'General Medicine',
          doctorId: booked.doctorId,
          startsAt: booked.startsAt,
          reason: 'Repeat booking',
        }),
      ),
    ).rejects.toThrow('no longer available');

    await harness.navigateByUrl('/patient/dashboard');
    expect(harness.routeNativeElement?.querySelector('app-stat-card strong')?.textContent).toBe(
      '3',
    );
    expect(
      harness.routeNativeElement?.querySelector('app-appointment-card')?.textContent,
    ).toContain('Wed, 06 Jan 2027');
    await firstValueFrom(service.cancel(booked.id, 'demo-patient'));
    await harness.navigateByUrl('/patient/book-appointment');
    await harness.navigateByUrl('/patient/dashboard');
    expect(harness.routeNativeElement?.querySelector('app-stat-card strong')?.textContent).toBe(
      '2',
    );
  });
});
