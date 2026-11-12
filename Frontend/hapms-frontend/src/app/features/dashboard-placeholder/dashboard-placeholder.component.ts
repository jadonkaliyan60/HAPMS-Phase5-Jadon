import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
@Component({
  selector: 'app-dashboard-placeholder',
  templateUrl: './dashboard-placeholder.component.html',
  styleUrl: './dashboard-placeholder.component.scss',
})
export class DashboardPlaceholder {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
