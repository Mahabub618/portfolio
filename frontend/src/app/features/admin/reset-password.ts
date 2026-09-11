import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-admin-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-dvh items-center justify-center bg-bg p-6">
      <div class="w-full max-w-sm rounded-2xl border border-line bg-surface/60 p-8 shadow-2xl">
        <span class="font-mono text-xs tracking-widest text-accent">PORTFOLIO // ADMIN</span>

        @if (done()) {
          <h1 class="mt-3 font-display text-2xl font-bold">Password reset</h1>
          <p role="status" class="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-400">
            Your password has been reset. You can sign in now.
          </p>
          <a routerLink="/admin/login"
            class="mt-6 inline-block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong">
            Go to sign in
          </a>
        } @else {
          <h1 class="mt-3 font-display text-2xl font-bold">Choose a new password</h1>
          <p class="mt-1 text-sm text-muted">Minimum 12 characters.</p>

          <form (submit)="submit(); $event.preventDefault()" class="mt-6">
            <label class="block text-sm">
              <span class="mb-1.5 block font-medium text-muted">New password</span>
              <input type="password" autocomplete="new-password" required [value]="next()"
                (input)="next.set($any($event.target).value)"
                class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent" />
            </label>
            <label class="mt-4 block text-sm">
              <span class="mb-1.5 block font-medium text-muted">Confirm new password</span>
              <input type="password" autocomplete="new-password" required [value]="confirmPw()"
                (input)="confirmPw.set($any($event.target).value)"
                class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent" />
            </label>

            @if (error()) {
              <p role="alert" class="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                {{ error() }}
              </p>
            }

            <button type="submit" [disabled]="busy()"
              class="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong disabled:opacity-50">
              {{ busy() ? 'Resetting…' : 'Reset password' }}
            </button>
          </form>
        }

        <a routerLink="/admin/login"
          class="mt-6 inline-block font-mono text-xs text-muted transition-colors hover:text-accent">← back to sign in</a>
      </div>
    </main>
  `,
  imports: [RouterLink],
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly next = signal('');
  readonly confirmPw = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly done = signal(false);

  constructor() {
    this.title.setTitle('Reset password · Admin');
    if (!this.token) {
      this.error.set('This reset link is invalid or has expired. Request a new one from the sign-in page.');
    }
  }

  submit(): void {
    if (this.busy() || this.done()) return;
    this.error.set('');
    const pw = this.next();
    if (pw.length < 12) {
      this.error.set('Password must be at least 12 characters.');
      return;
    }
    if (pw !== this.confirmPw()) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.busy.set(true);
    this.auth.resetPassword(this.token, pw).subscribe({
      next: () => {
        this.busy.set(false);
        this.done.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(err.error?.error?.message ?? 'Reset failed. Is the API reachable?');
      },
    });
  }
}
