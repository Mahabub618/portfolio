import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth';
import { ThemeService } from '../../core/theme';
import { ConfirmHost, ToastHost } from './admin-kit';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastHost, ConfirmHost],
  template: `
    <div class="min-h-dvh bg-bg text-ink">
      <!-- sidebar (desktop) -->
      <aside class="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface/60 backdrop-blur lg:flex">
        <a routerLink="/" class="flex items-center gap-2.5 px-6 py-6">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-display text-sm font-bold text-accentink shadow-lg shadow-accent/30">P</span>
          <span class="font-display text-sm font-bold tracking-wide">PORTFOLIO<span class="text-accent">/ADMIN</span></span>
        </a>
        <nav class="flex-1 space-y-1 px-3" aria-label="Admin sections">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-accent/12 text-accent" [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
              class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink">
              <span class="w-5 text-center" aria-hidden="true">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="border-t border-line p-4 text-xs text-muted">
          <p class="truncate font-mono">{{ auth.email() }}</p>
          <div class="mt-2 flex gap-3">
            <a routerLink="/" class="transition-colors hover:text-accent">View site ↗</a>
            <button type="button" (click)="auth.logout()" class="transition-colors hover:text-red-400">Sign out</button>
          </div>
        </div>
      </aside>

      <!-- top bar -->
      <header class="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-5 py-3 backdrop-blur lg:pl-64">
        <a routerLink="/" class="flex items-center gap-2 lg:hidden">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent font-display text-xs font-bold text-accentink">P</span>
          <span class="font-display text-xs font-bold">ADMIN</span>
        </a>
        <!-- mobile nav -->
        <nav class="scrollbar-thin -mx-1 flex flex-1 gap-1 overflow-x-auto px-1 lg:hidden" aria-label="Admin sections">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-accent/12 text-accent" [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
              class="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted">{{ item.label }}</a>
          }
        </nav>
        <div class="flex items-center gap-2">
          <button type="button" (click)="theme.toggle()" [attr.aria-label]="'Switch to ' + (theme.theme() === 'dark' ? 'light' : 'dark') + ' theme'"
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-sm transition-colors hover:border-accent/60">
            {{ theme.theme() === 'dark' ? '☀' : '☾' }}
          </button>
          <a routerLink="/" target="_blank" rel="noopener"
            class="hidden rounded-xl border border-line px-3.5 py-2 text-xs font-medium transition-colors hover:border-accent/60 sm:block">
            View site ↗
          </a>
          <button type="button" (click)="auth.logout()"
            class="rounded-xl border border-line px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10">
            Sign out
          </button>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-5 py-8 lg:pl-64">
        <router-outlet />
      </main>
    </div>

    <app-toast-host />
    <app-confirm-host />
  `,
})
export class AdminShell {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly nav: NavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: '◈' },
    { path: '/admin/profile', label: 'Profile', icon: '☺' },
    { path: '/admin/projects', label: 'Projects', icon: '▣' },
    { path: '/admin/education', label: 'Education', icon: '⌂' },
    { path: '/admin/achievements', label: 'Achievements', icon: '★' },
    { path: '/admin/activities', label: 'Activities', icon: '✦' },
    { path: '/admin/blogs', label: 'Travel blogs', icon: '✈' },
    { path: '/admin/security', label: 'Security', icon: '⚙' },
  ];
}
