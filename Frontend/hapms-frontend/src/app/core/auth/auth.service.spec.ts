import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { DEMO_ACCOUNTS } from '../../mocks/data/demo-accounts';
describe('mock authentication', () => {
  it('authenticates each role and clears the session', async () => {
    const auth = TestBed.inject(AuthService);
    for (const account of DEMO_ACCOUNTS) {
      expect(
        (await firstValueFrom(auth.login(account.user.email, account.password, false))).role,
      ).toBe(account.user.role);
      auth.logout();
      expect(auth.user()).toBeNull();
    }
  });
  it('rejects invalid credentials', async () => {
    await expect(
      firstValueFrom(TestBed.inject(AuthService).login('bad@example.com', 'wrong', false)),
    ).rejects.toThrow('Email or password');
  });
  it('registers a temporary patient and rejects duplicate email', async () => {
    const auth = TestBed.inject(AuthService);
    const data = {
      fullName: 'Demo',
      email: 'new@example.com',
      password: 'Testing1!',
      dateOfBirth: '2000-01-01',
      gender: 'Female',
      phone: '0821234567',
      terms: true,
    };
    expect((await firstValueFrom(auth.register(data))).role).toBe('patient');
    expect((await firstValueFrom(auth.login(data.email, data.password, false))).email).toBe(
      data.email,
    );
    await expect(firstValueFrom(auth.register(data))).rejects.toThrow('already exists');
    expect(new AuthService().user()).toBeNull();
  });
});
