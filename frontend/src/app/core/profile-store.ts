import { Injectable, computed, inject, signal } from '@angular/core';
import { Api } from './api';
import { Profile } from './models';

/** Loads the single-row profile once and shares it across components. */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly api = inject(Api);

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly name = computed(() => this.profile()?.name ?? 'Portfolio');

  private requested = false;

  ensureLoaded(): void {
    if (this.requested) return;
    this.requested = true;
    this.load();
  }

  /** Re-fetch (used after the admin panel edits the profile). */
  refresh(): void {
    this.load();
  }

  private load(): void {
    this.api.get<Profile>('/profile').subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
