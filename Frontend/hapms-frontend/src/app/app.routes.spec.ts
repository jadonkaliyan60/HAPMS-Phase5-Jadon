import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

describe('application routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    }),
  );

  it('loads the separate login and registration pages', async () => {
    const harness = await RouterTestingHarness.create();
    
    await harness.navigateByUrl('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Sign in to your account');
    
    await harness.navigateByUrl('/register');
    expect(harness.routeNativeElement?.textContent).toContain('Create');
  });
});