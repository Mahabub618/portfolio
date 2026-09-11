import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-admin-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-dvh items-center justify-center bg-bg p-6">
      <div class="w-full max-w-sm rounded-2xl border border-line bg-surface/60 p-8 shadow-2xl">
        <span class="font-mono text-xs tracking-widest text-accent">PORTFOLIO // ADMIN</span>
        <h1 class="mt-3 font-display text-2xl font-bold">Forgot your password?</h1>
        <p class="mt-1 text-sm text-muted">
          Enter the admin email and we'll send a one-time reset link.
        </p>

        <form (submit)="submit(); $event.preventDefault()" class="mt-6">
          <label class="block text-sm">
            <span class="mb-1.5 block font-medium text-muted">Email</span>
            <input type="email" autocomplete="username" required [value]="email()"
              (input)="email.set($any($event.target).value)"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent" />
          </label>

          @if (error()) {
            <p role="alert" class="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
              {{ error() }}
            </p>
          }

          <button type="submit" [disabled]="busy() || cooldown() > 0"
            class="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong disabled:opacity-50">
            @if (busy()) { Sending… }
            @else if (cooldown() > 0) { Resend in {{ cooldown() }}s }
            @else { Send reset link }
          </button>
        </form>

        @if (sent()) {
          <p role="status" class="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-400">
            If an account with that email exists, a reset link is on its way.
            Check your inbox (and spam folder). The link expires in 15 minutes.
          </p>
        }

        <a routerLink="/admin/login"
          class="mt-6 inline-block font-mono text-xs text-muted transition-colors hover:text-accent">← back to sign in</a>
      </div>
    </main>
  `,
  imports: [RouterLink],
})
export class ForgotPasswordPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly title = inject(Title);
  private timer?: ReturnType<typeof setInterval>;

  readonly email = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly sent = signal(false);
  readonly cooldown = signal(0);

  constructor() {
    this.title.setTitle('Forgot password · Admin');
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  submit(): void {
    if (this.busy() || this.cooldown() > 0) return;
    this.busy.set(true);
    this.error.set('');
    this.sent.set(false);
    this.auth.forgotPassword(this.email()).subscribe({
      next: () => {
        this.busy.set(false);
        this.sent.set(true);
        this.startCooldown(60);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(err.error?.error?.message ?? 'Request failed. Is the API reachable?');
      },
    });
  }

  private startCooldown(seconds: number): void {
    this.cooldown.set(seconds);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.cooldown.update((s) => s - 1);
      if (this.cooldown() <= 0 && this.timer) clearInterval(this.timer);
    }, 1000);
  }
}
