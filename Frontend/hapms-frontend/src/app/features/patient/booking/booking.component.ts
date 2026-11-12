import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timer } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Appointment } from '../../../core/models/appointment';
import { BookingDay, VISIT_REASON_LIMIT } from '../../../core/models/booking';
import { Doctor } from '../../../core/models/doctor';
import { AppointmentService } from '../../../core/services/appointment.service';
import { hospitalDate } from '../../../core/services/booking-dates';
import { DoctorService } from '../../../core/services/doctor.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookingCalendarComponent } from './booking-calendar.component';

@Component({
  selector: 'app-booking',
  imports: [BookingCalendarComponent, DatePipe, IconComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent {
  private readonly service = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clock = toSignal(timer(0, 30_000), { initialValue: 0 });
  readonly user = inject(AuthService).user;
  
  readonly today = computed(() => {
    this.clock();
    return hospitalDate();
  });
  
  readonly month = signal(hospitalDate().slice(0, 7));
  readonly doctors = signal<readonly Doctor[]>([]);
  readonly department = signal('');
  readonly consultationType = signal<'In-Person' | 'Virtual'>('In-Person');
  readonly doctorId = signal('');
  readonly date = signal('');
  readonly startsAt = signal('');
  readonly days = signal<readonly BookingDay[]>([]);
  readonly loading = signal(false);
  readonly booking = signal(false);
  readonly doctorError = signal('');
  readonly availabilityError = signal('');
  readonly bookingError = signal('');
  readonly confirmation = signal<Appointment | null>(null);
  private readonly refresh = signal(0);
  readonly reasonLimit = VISIT_REASON_LIMIT;
  
  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(VISIT_REASON_LIMIT),
    ],
  });
  
  readonly reasonText = toSignal(this.reason.valueChanges, { initialValue: '' });
  
  readonly departments = computed(() => [
    ...new Set(this.doctors().map((doctor) => doctor.department)),
  ]);
  
  readonly filteredDoctors = computed(() =>
    this.doctors().filter((doctor) => doctor.department === this.department()),
  );
  
  readonly doctor = computed(() =>
    this.filteredDoctors().find((doctor) => doctor.id === this.doctorId()),
  );
  
  readonly initials = computed(() =>
    this.doctor()
      ?.fullName.replace(/^Dr\.\s+/, '')
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join(''),
  );
  
  readonly slots = computed(() => this.days().find((day) => day.date === this.date())?.slots ?? []);
  
  readonly slot = computed(() =>
    this.slots().find((slot) => slot.startsAt === this.startsAt() && slot.state === 'available'),
  );
  
  readonly canBook = computed(
    () =>
      this.user()?.role === 'patient' &&
      !!this.doctor() &&
      !!this.slot() &&
      !!this.reasonText().trim() &&
      this.reasonText().length <= VISIT_REASON_LIMIT &&
      !this.loading() &&
      !this.booking(),
  );

  constructor() {
    this.doctorService
      .getDoctors()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (apiDoctors: any[]) => {
          const liveDoctors = apiDoctors.map(doc => ({
            id: String(doc.id),
            fullName: doc.name,
            department: doc.department,
            specialty: doc.specialty,
            room: '204',
            duration: 30
          } as any));
          this.doctors.set(liveDoctors);
        },
        error: () =>
          this.doctorError.set(
            'Doctors could not be loaded. Please try again.',
          ),
      });

    effect((onCleanup) => {
      const doctor = this.doctor();
      const month = this.month();
      this.refresh();
      this.clock();
      if (!doctor) return;
      this.loading.set(true);
      this.availabilityError.set('');
      const request = this.service.availability(doctor.id, month).subscribe({
        next: (days) => {
          this.days.set(days);
          this.loading.set(false);
        },
        error: () => {
          this.days.set([]);
          this.loading.set(false);
          this.availabilityError.set(
            'Available times could not be loaded. Try refreshing availability.',
          );
        },
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  selectDepartment(department: string): void {
    this.department.set(department);
    this.selectDoctor('');
  }

  selectDoctor(id: string): void {
    this.doctorId.set(id);
    this.days.set([]);
    this.selectDate('');
    this.availabilityError.set('');
    this.loading.set(!!id);
  }

  selectMonth(month: string): void {
    this.month.set(month);
    this.days.set([]);
    this.selectDate('');
    this.loading.set(!!this.doctor());
  }

  selectDate(date: string): void {
    this.date.set(date);
    this.selectTime('');
  }

  selectTime(startsAt: string): void {
    this.startsAt.set(startsAt);
    this.bookingError.set('');
    this.confirmation.set(null);
  }

  refreshAvailability(): void {
    this.refresh.update((value) => value + 1);
  }

  confirmBooking(): void {
    const doctor = this.doctor();
    const slot = this.slot();
    const currentUser = this.user();
    
    if (!this.canBook() || !doctor || !slot || !currentUser || this.reason.invalid) return;
    
    this.booking.set(true);
    this.bookingError.set('');
    
    this.service
      .book({
        doctorId: doctor.id,
        doctorName: doctor.fullName, 
        department: doctor.department,
        startsAt: slot.startsAt,
        reason: this.reason.value,
        type: this.consultationType(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.booking.set(false)),
      )
      .subscribe({
        next: (appointment) => {
          this.startsAt.set('');
          this.reason.reset();
          this.confirmation.set(appointment);
          this.refreshAvailability();
        },
        error: () => {
          this.startsAt.set('');
          this.bookingError.set(
            'Booking could not be confirmed. Check availability and choose a time again.',
          );
          this.refreshAvailability();
        },
      });
  }
}