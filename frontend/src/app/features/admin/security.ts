import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth';
import { ToastService } from './admin-kit';

@Component({
  selector: 'app-admin-security',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h2 class="font-display text-2xl font-bold">Security</h2>
      <p class="mt-1 text-sm text-muted">Rotate the administrator password. Minimum 12 characters.</p>
    </header>

    <form (submit)="submit(); $event.preventDefault()"
      class="mt-8 max-w-md rounded-2xl border border-line bg-surface/40 p-6">
      <label class="block text-sm">
        <span class="mb-1.5 block font-medium text-muted">Current password</span>
        <input type="password" autocomplete="current-password" required [value]="current()"
          (input)="current.set($any($event.target).value)"
          class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label class="mt-4 block text-sm">
        <span class="mb-1.5 block font-medium text-muted">New password</span>
        <input type="password" autocomplete="new-password" required [value]="next()"
          (input)="next.set($any($event.target).value)"
          class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label class="mt-4 block text-sm">
        <span class="mb-1.5 block font-medium text-muted">Confirm new password</span>
        <input type="password" autocomplete="new-password" required [value]="confirmPw()"
          (input)="confirmPw.set($any($event.target).value)"
          class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>

      @if (error()) {
        <p role="alert" class="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
          {{ error() }}
        </p>
      }

      <button type="submit" [disabled]="busy()"
        class="mt-6 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong disabled:opacity-50">
        {{ busy() ? 'Updating…' : 'Update password' }}
      </button>
    </form>
  `,
})
export class AdminSecurity {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly current = signal('');
  readonly next = signal('');
  readonly confirmPw = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  submit(): void {
    this.error.set('');
    const [cur, next, conf] = [this.current(), this.next(), this.confirmPw()];
    if (next.length < 12) {
      this.error.set('New password must be at least 12 characters.');
      return;
    }
    if (next === cur) {
      this.error.set('New password must be different from the current one.');
      return;
    }
    if (next !== conf) {
      this.error.set('Confirmation does not match the new password.');
      return;
    }
    this.busy.set(true);
    this.auth.changePassword(cur, next).subscribe({
      next: () => {
        this.busy.set(false);
        this.current.set('');
        this.next.set('');
        this.confirmPw.set('');
        this.toast.ok('Password updated — use it on your next sign-in');
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(err.error?.error?.message ?? 'Update failed');
      },
    });
  }
}
