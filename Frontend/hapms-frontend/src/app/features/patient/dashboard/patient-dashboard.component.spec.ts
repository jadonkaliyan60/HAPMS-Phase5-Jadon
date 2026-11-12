import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { APPOINTMENT_DATA } from '../../../core/services/appointment-data';
import { createMockAppointmentData } from '../../../mocks/data/appointments';
import { PatientDashboardComponent } from './patient-dashboard.component';

describe('patient dashboard', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: APPOINTMENT_DATA, useFactory: createMockAppointmentData },
      ],
    });
    await firstValueFrom(
      TestBed.inject(AuthService).login('patient@hapms.demo', 'Demo123!', false),
    );
  });

  it('sorts visits, expands history and cancels only after confirmation', async () => {
    const fixture = TestBed.createComponent(PatientDashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element: HTMLElement = fixture.nativeElement;
    expect(component.upcoming()).toHaveLength(2);
    expect(component.completed()).toHaveLength(6);
    expect(component.nextAppointment()?.id).toBe('mock-appointment-1');
    expect(component.visibleHistory().map((appointment) => appointment.id)).toEqual([
      'mock-appointment-3',
      'mock-appointment-4',
      'mock-appointment-5',
    ]);
    component.showAllHistory.set(true);
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(6);
    const cancelButton = element.querySelector<HTMLButtonElement>('app-appointment-card .cancel')!;
    cancelButton.click();
    fixture.detectChanges();
    expect(component.upcoming()).toHaveLength(2);
    expect(element.querySelector('[role="alertdialog"]')).toBeTruthy();
    element.querySelector<HTMLButtonElement>('.confirm-button')!.click();
    fixture.detectChanges();
    expect(component.upcoming()).toHaveLength(1);
    expect(component.nextAppointment()?.id).toBe('mock-appointment-2');
    expect(element.querySelector('[role="alertdialog"]')).toBeNull();
    component.pendingCancellation.set(component.nextAppointment());
    component.confirmCancellation();
    fixture.detectChanges();
    expect(element.textContent).toContain('No upcoming appointments');
    expect(component.upcoming()).toHaveLength(0);
  });

  it('shows clear the rescheduling placeholder', () => {
    const fixture = TestBed.createComponent(PatientDashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.showReschedulePlaceholder();
    expect(component.notice()).toContain('Rescheduling placeholder');
  });
});
