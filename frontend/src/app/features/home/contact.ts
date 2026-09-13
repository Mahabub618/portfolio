import { Component, inject } from '@angular/core';
import { ProfileStore } from '../../core/profile-store';

@Component({
  selector: 'app-contact',
  template: `
    <section id="contacts" class="border-t border-line bg-surface/40">
      <div class="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <p class="font-mono text-xs tracking-[0.3em] text-accent uppercase">Contact</p>
        <h2 class="mt-3 font-display text-3xl font-bold md:text-4xl">Get in touch</h2>
        <p class="mt-4 max-w-xl leading-relaxed text-muted">
          Have an opportunity, a question, or just want to say hello?
          Reach me through any of these channels — I usually reply within a day.
        </p>

        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (entry of socials(); track entry[0]) {
            <a
              [href]="entry[1]"
              [target]="entry[1].startsWith('http') ? '_blank' : null"
              [rel]="entry[1].startsWith('http') ? 'noopener' : null"
              class="group flex items-center gap-4 rounded-2xl border border-line bg-bg p-5 transition-all hover:border-accent/60"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 font-display text-sm font-bold text-accent uppercase">
                {{ entry[0].charAt(0) }}
              </span>
              <span class="truncate capitalize font-medium">{{ entry[0] }}</span>
              <span class="ml-auto text-muted transition-colors group-hover:text-accent" aria-hidden="true">↗</span>
            </a>
          } @empty {
            <p class="text-sm text-muted">Contact links will appear here once added in the admin panel.</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class Contact {
  private readonly store = inject(ProfileStore);

  constructor() {
    this.store.ensureLoaded();
  }

  socials(): [string, string][] {
    return Object.entries(this.store.profile()?.socialLinks ?? {}).filter(
      ([, url]) => !!url && url.trim() !== '',
    );
  }
}
