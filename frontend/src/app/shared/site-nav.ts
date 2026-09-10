import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileStore } from '../core/profile-store';
import { ThemeService } from '../core/theme';

const LINKS = [
  { fragment: 'projects', label: 'Projects' },
  { fragment: 'education', label: 'Education' },
  { fragment: 'achievements', label: 'Achievements' },
  { fragment: 'activities', label: 'Activities' },
  { fragment: 'travel', label: 'Travel' },
];

@Component({
  imports: [RouterLink],
  selector: 'app-site-nav',
  template: `
    <nav
      class="fixed inset-x-0 top-0 z-40 transition-all duration-300"
      [class.bg-surface/85]="solid()"
      [class.backdrop-blur-md]="solid()"
      [class.border-b]="solid()"
      [class.border-line]="solid()"
      aria-label="Primary"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a routerLink="/" class="font-display text-sm font-semibold tracking-[0.2em] uppercase">
          {{ initials() }}
        </a>
        <div class="hidden items-center gap-6 md:flex">
          @for (link of links; track link.fragment) {
            <a
              [routerLink]="['/']"
              [fragment]="link.fragment"
              class="text-sm text-muted transition-colors hover:text-ink"
            >{{ link.label }}</a>
          }
        </div>
        <button
          type="button"
          (click)="theme.toggle()"
          class="rounded-full border border-line p-2 text-muted transition-colors hover:text-ink"
          [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          @if (theme.theme() === 'dark') {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          }
        </button>
      </div>
    </nav>
  `,
})
export class SiteNav {
  readonly links = LINKS;
  readonly theme = inject(ThemeService);
  private readonly profileStore = inject(ProfileStore);
  readonly solid = signal(false);

  constructor() {
    this.profileStore.ensureLoaded();
  }

  initials(): string {
    const name = this.profileStore.profile()?.name ?? 'Portfolio';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.solid.set(window.scrollY > window.innerHeight * 0.75);
  }
}
