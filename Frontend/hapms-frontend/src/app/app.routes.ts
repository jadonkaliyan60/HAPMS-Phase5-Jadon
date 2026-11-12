import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { UserRole } from './core/models/user';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Login | HAPMS',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'register',
    title: 'Register | HAPMS',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
  },
  ...(['patient', 'doctor', 'nurse', 'admin'] as UserRole[]).map((role) => ({
    path: role,
    data: { role },
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component').then(
        (module) => module.DashboardLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard | HAPMS',
        data: { role },
        canActivate: [authGuard],
        loadComponent:
          role === 'patient'
            ? () =>
                import('./features/patient/dashboard/patient-dashboard.component').then(
                  (module) => module.PatientDashboardComponent,
                )
            : role === 'doctor'
              ? () =>
                  import('./features/doctor/dashboard/doctor-dashboard.component').then(
                    (module) => module.DoctorDashboardComponent,
                  )
              : role === 'admin'
                ? () =>
                    import('./features/admin-dashboard/admin-dashboard').then(
                      (module) => module.AdminDashboard,
                    )
                : role === 'nurse'
                  ? () =>
                      import('./features/nurse-dashboard/nurse-dashboard').then(
                        (module) => module.NurseDashboard,
                      )
                  : () =>
                      import('./features/dashboard-placeholder/dashboard-placeholder.component').then(
                        (module) => module.DashboardPlaceholder,
                      ),
      },
      ...(role === 'patient'
        ? [
            {
              path: 'book-appointment',
              title: 'Book Appointment | HAPMS',
              data: { role },
              canActivate: [authGuard],
              loadComponent: () =>
                import('./features/patient/booking/booking.component').then(
                  (module) => module.BookingComponent,
                ),
            },
          ]
        : []),
      ...(role === 'doctor'
        ? [
            {
              path: 'appointments',
              title: 'Manage Appointments | HAPMS',
              data: { role },
              canActivate: [authGuard],
              loadComponent: () =>
                import('./features/doctor/appointments/doctor-appointments.component').then(
                  (module) => module.DoctorAppointmentsComponent,
                ),
            },
          ]
        : []),
      { path: '', pathMatch: 'full' as const, redirectTo: 'dashboard' },
    ],
  })),
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];