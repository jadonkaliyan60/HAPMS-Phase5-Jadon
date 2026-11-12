import { AbstractControl, ValidationErrors } from '@angular/forms';
export function birthDate(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const date = new Date(control.value + 'T00:00:00');
  return !Number.isFinite(date.getTime()) || date > new Date() ? { birthDate: true } : null;
}
export function phoneNumber(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const value = String(control.value).replace(/[ ()-]/g, '');
  return /^0\d{9}$/.test(value) || /^\+[1-9]\d{6,14}$/.test(value) ? null : { phone: true };
}
export function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('confirmPassword')?.value
    ? null
    : { mismatch: true };
}
