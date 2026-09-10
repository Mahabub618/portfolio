import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileStore } from '../core/profile-store';

@Component({
  imports: [RouterLink],
  selector: 'app-site-footer',
  template: `
    <footer class="border-t border-line">
      <div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="font-display font-semibold">{{ profile()?.name ?? 'Portfolio' }}</p>
          <p class="mt-1 text-sm text-muted">
            Built with Angular &amp; Spring Boot · Content managed via
            <a routerLink="/admin/login" class="text-accent hover:text-accentstrong">admin</a>
          </p>
        </div>
        <div class="flex gap-5 text-sm">
          @for (entry of socials(); track entry[0]) {
            <a [href]="entry[1]" target="_blank" rel="noopener" class="capitalize text-muted transition-colors hover:text-ink">
              {{ entry[0] }}
            </a>
          }
        </div>
      </div>
    </footer>
  `,
})
export class SiteFooter {
  private readonly profileStore = inject(ProfileStore);

  constructor() {
    this.profileStore.ensureLoaded();
  }

  profile() {
    return this.profileStore.profile();
  }

  socials(): [string, string][] {
    return Object.entries(this.profileStore.profile()?.socialLinks ?? {});
  }
}
