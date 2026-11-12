import { TestBed } from '@angular/core/testing';
import { BookingCalendarComponent } from './booking-calendar.component';

it('renders the Monday-first month grid, disables past dates and navigates across years', () => {
  const fixture = TestBed.createComponent(BookingCalendarComponent);
  fixture.componentRef.setInput('today', '2026-12-28');
  fixture.componentRef.setInput('month', '2026-12');
  fixture.componentRef.setInput('selected', '');
  fixture.componentRef.setInput('days', [
    { date: '2026-12-27', slots: [{ startsAt: '', endsAt: '', state: 'available' }] },
    { date: '2026-12-29', slots: [{ startsAt: '', endsAt: '', state: 'available' }] },
  ]);
  fixture.detectChanges();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')!.disabled).toBe(
    true,
  );
  expect(
    element.querySelector<HTMLButtonElement>(
      '[aria-label="Sunday, 27 December 2026, unavailable"]',
    )!.disabled,
  ).toBe(true);
  const selected = vi.fn();
  const changed = vi.fn();
  fixture.componentInstance.dateChange.subscribe(selected);
  fixture.componentInstance.monthChange.subscribe(changed);
  element.querySelector<HTMLButtonElement>('[aria-label="Tuesday, 29 December 2026"]')!.click();
  expect(selected).toHaveBeenCalledWith('2026-12-29');
  element.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!.click();
  expect(changed).toHaveBeenCalledWith('2027-01');
});
