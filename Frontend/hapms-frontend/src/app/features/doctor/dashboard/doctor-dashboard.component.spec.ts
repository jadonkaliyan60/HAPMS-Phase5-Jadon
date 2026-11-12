import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/auth/auth.service';
import { APPOINTMENT_DATA } from '../../../core/services/appointment-data';
import { AppointmentService } from '../../../core/services/appointment.service';
import { createMockAppointmentData } from '../../../mocks/data/appointments';

describe('doctor dashboard', () => {
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

  it('shows only today’s assigned visits, including a patient booking made before doctor login', async () => {
    const auth = TestBed.inject(AuthService);
    const service = TestBed.inject(AppointmentService);
    await firstValueFrom(auth.login('patient@hapms.demo', 'Demo123!', false));
    const booking = await firstValueFrom(
      service.book({
        department: 'General Medicine',
        doctorId: 'mock-doctor-chen',
        startsAt: '2027-01-06T08:30:00.000Z',
        reason: 'Fictional follow-up',
      }),
    );
    await firstValueFrom(
      service.book({
        department: 'Cardiology',
        doctorId: 'mock-doctor-wilson',
        startsAt: '2027-01-06T11:00:00.000Z',
        reason: 'Fictional review',
      }),
    );
    auth.logout();

    const harness = await RouterTestingHarness.create('/doctor/appointments');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/login');
    const login = harness.routeNativeElement!;
    for (const [id, value] of [
      ['email', 'doctor@hapms.demo'],
      ['password', 'Demo123!'],
    ]) {
      const input = login.querySelector<HTMLInputElement>('input#' + id)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    const signedIn = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    login.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await signedIn;
    harness.detectChanges();
    expect(router.url).toBe('/doctor/dashboard');
    const view = harness.routeNativeElement!;
    expect(view.querySelector('.identity')?.textContent).toContain('Dr. Olivia Chen');
    expect(view.querySelector('.avatar')?.textContent?.trim()).toBe('OC');
    expect(view.querySelector('.header-date')?.textContent).toContain('6 January 2027');
    expect(
      Array.from(view.querySelectorAll('app-stat-card strong')).map((card) => card.textContent),
    ).toEqual(['10', '2', '7', '1']);
    expect(view.textContent).toContain('5 confirmed · 2 pending');
    const rows = Array.from(view.querySelectorAll('tbody tr'));
    const times = rows.map((row) => row.querySelector('time')!.dateTime);
    expect(times).toEqual([...times].sort());
    expect(rows.filter((row) => row.textContent?.includes('Emma Bennett'))).toHaveLength(1);
    expect(
      rows.find(
        (row) =>
          row.querySelector('time')?.dateTime === booking.startsAt &&
          row.textContent?.includes('Emma Bennett'),
      )?.textContent,
    ).toContain('Confirmed');
    expect(times).not.toContain('2027-01-06T11:00:00.000Z');
    expect(rows.every((row) => row.querySelector('time')!.dateTime.startsWith('2027-01-06'))).toBe(
      true,
    );
    expect(view.textContent).not.toContain('Fictional follow-up');
    expect(view.querySelectorAll('a[href="/doctor/appointments"]')).toHaveLength(3);

    await harness.navigateByUrl('/doctor/appointments');
    expect(harness.routeNativeElement?.textContent).toContain('Manage appointments');
    const signedOut = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.sign-out')!.click();
    await signedOut;
    expect(router.url).toBe('/login');
    await harness.navigateByUrl('/doctor/dashboard');
    expect(router.url).toBe('/login');
  });

  it('excludes past scheduled and pending visits from upcoming without completing them', async () => {
    vi.setSystemTime(new Date('2027-01-06T10:45:00Z'));
    await firstValueFrom(TestBed.inject(AuthService).login('doctor@hapms.demo', 'Demo123!', false));
    const harness = await RouterTestingHarness.create('/doctor/dashboard');
    const view = harness.routeNativeElement!;
    expect(
      Array.from(view.querySelectorAll('app-stat-card strong')).map((card) => card.textContent),
    ).toEqual(['11', '4', '4', '1']);
    expect(view.textContent).toContain('3 confirmed · 1 pending');
    const pendingRow = Array.from(view.querySelectorAll('tbody tr')).find((row) =>
      row.textContent?.includes('Oliver Scott'),
    );
    expect(pendingRow?.textContent).toContain('Pending');
  });
});
