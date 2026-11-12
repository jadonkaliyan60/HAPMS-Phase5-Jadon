import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  providers: [DatePipe],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);

  readonly user = this.authService.user;
  readonly currentDate = this.datePipe.transform(new Date(), 'EEEE, d MMMM y') || '';
  
  readonly userRole = computed(() => this.user()?.role || null);
  
  readonly roleTitle = computed(() => {
    const role = this.userRole();
    if (!role) return '';
    if (role === 'admin') return 'Administrator';
    return role.charAt(0).toUpperCase() + role.slice(1);
  });

  readonly userInitials = computed(() => {
    const name = this.user()?.fullName;
    if (!name) return 'U';
    
    let cleanName = name;
    if (cleanName.toLowerCase().startsWith('dr. ')) {
      cleanName = cleanName.substring(4);
    }
    cleanName = cleanName.trim();
    
    const parts = cleanName.split(/\s+/);
    
    if (parts.length >= 2 && parts[1].length > 0) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return cleanName.substring(0, 2).toUpperCase();
  });

  readonly userFullName = computed(() => this.user()?.fullName || '');

  logout() {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}