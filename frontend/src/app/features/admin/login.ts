import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-dvh">
      <!-- brand panel -->
      <aside class="relative hidden w-1/2 overflow-hidden border-r border-line bg-surface lg:block">
        <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-[120px]"></div>
        <div class="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-accentstrong/15 blur-[120px]"></div>
        <div class="relative flex h-full flex-col justify-between p-12">
          <span class="font-mono text-sm tracking-widest text-accent">PORTFOLIO // ADMIN</span>
          <div>
            <h1 class="font-display text-4xl font-bold leading-tight">
              Your content,<br />under your control.
            </h1>
            <p class="mt-4 max-w-sm leading-relaxed text-muted">
              Projects, achievements, education, travel stories — every word and image on
              this site is editable from here.
            </p>
          </div>
          <a routerLink="/" class="font-mono text-xs text-muted transition-colors hover:text-accent">← back to the site</a>
        </div>
      </aside>

      <!-- form panel -->
      <main class="flex flex-1 items-center justify-center bg-bg p-6">
        <form (submit)="submit(); $event.preventDefault()"
          class="w-full max-w-sm rounded-2xl border border-line bg-surface/60 p-8 shadow-2xl">
          <h2 class="font-display text-2xl font-bold">Sign in</h2>
          <p class="mt-1 text-sm text-muted">Use the administrator account.</p>

          <label class="mt-6 block text-sm">
            <span class="mb-1.5 block font-medium text-muted">Email</span>
            <input type="email" autocomplete="username" required [value]="email()"
              (input)="email.set($any($event.target).value)"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent" />
          </label>
          <label class="mt-4 block text-sm">
            <span class="mb-1.5 block font-medium text-muted">Password</span>
            <input type="password" autocomplete="current-password" required [value]="password()"
              (input)="password.set($any($event.target).value)"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent" />
          </label>

          @if (error()) {
            <p role="alert" class="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
              {{ error() }}
            </p>
          }

          <div class="mt-3 text-right">
            <a routerLink="/admin/forgot-password"
              class="text-xs text-muted transition-colors hover:text-accent">Forgot password?</a>
          </div>

          <button type="submit" [disabled]="busy()"
            class="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong disabled:opacity-50">
            {{ busy() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </main>
    </div>
  `,
  imports: [RouterLink],
})
export class AdminLoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  readonly email = signal('');
  readonly password = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  constructor() {
    this.title.setTitle('Sign in · Admin');
  }

  submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.auth.login(this.email(), this.password()).subscribe({
      next: (res) => {
        this.auth.completeLogin(res);
        this.router.navigate(['/admin']);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(err.error?.error?.message ?? 'Sign-in failed. Is the API reachable?');
      },
    });
  }
}
