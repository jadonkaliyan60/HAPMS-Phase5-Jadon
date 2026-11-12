import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  template: `<div class="field">
    <label [for]="id()">{{ label() }}</label>
    <div class="input-wrap">
      <input
        [id]="id()"
        [type]="type() === 'password' && visible() ? 'text' : type()"
        [formControl]="control()"
        [autocomplete]="autocomplete()"
        [attr.max]="max() || null"
        [attr.aria-invalid]="invalid()"
        [attr.aria-describedby]="id() + '-help'"
        [class.invalid]="invalid()"
      />
      @if (type() === 'password') {
        <button
          type="button"
          class="eye"
          [attr.aria-label]="(visible() ? 'Hide ' : 'Show ') + label().toLowerCase()"
          (click)="visible.set(!visible())"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
            <circle
              cx="12"
              cy="12"
              r="3"
            />
            @if (!visible()) {
              <path d="m3 3 18 18" />
            }
          </svg>
        </button>
      }
      @if (type() === 'email') {
        <span
          class="input-icon"
          aria-hidden="true"
          >✉</span
        >
      }
    </div>
    <div [id]="id() + '-help'">
      @if (invalid()) {
        <p class="error">{{ errorText() }}</p>
      } @else if (hint()) {
        <p class="hint">{{ hint() }}</p>
      }
    </div>
  </div>`,
})
export class FormField {
  readonly control = input.required<FormControl<string>>();
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input('text');
  readonly autocomplete = input('off');
  readonly hint = input('');
  readonly max = input('');
  readonly externalError = input('');
  readonly visible = signal(false);
  invalid() {
    return this.control().touched && (this.control().invalid || !!this.externalError());
  }
  errorText() {
    const errors = this.control().errors;
    if (errors?.['required'] || (errors?.['pattern'] && this.id() === 'fullName'))
      return this.label() + ' is required.';
    if (errors?.['email']) return 'Enter a valid email address.';
    if (errors?.['birthDate']) return 'Enter a valid date of birth that is not in the future.';
    if (errors?.['phone'])
      return 'Enter a 10-digit South African number or an international number with +country code.';
    if (errors?.['minlength'] || errors?.['pattern'])
      return 'Use at least 8 characters, including a number and a symbol.';
    return this.externalError();
  }
}
