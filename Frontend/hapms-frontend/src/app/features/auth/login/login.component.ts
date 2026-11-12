import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly showPasswordResetNotice = signal(false);
  
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  signIn() {
    this.form.markAllAsTouched();
    this.errorMessage.set('');
    
    if (this.form.invalid || this.isSubmitting()) return;
    
    this.isSubmitting.set(true);
    const { email, password, rememberMe } = this.form.getRawValue();
    
    this.authService
      .login(email, password, rememberMe)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (user) => {
          const routePath = (user.role as string) === 'administrator' ? 'admin' : user.role;
          void this.router.navigate(['/', routePath, 'dashboard']);
        },
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }
}