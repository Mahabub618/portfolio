import { Component, inject, signal } from '@angular/core';
import { monthYear } from '../../core/dates';
import { Extracurricular as Activity } from '../../core/models';
import { ExtracurricularService } from '../../core/services';
import { RevealDirective } from '../../shared/reveal';
import { SectionHeading } from '../../shared/section-heading';

@Component({
  imports: [SectionHeading, RevealDirective],
  selector: 'app-extracurricular',
  template: `
    <section id="activities" class="border-t border-line bg-surface/40">
      <div class="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <app-section-heading index="04" kicker="Beyond code" title="Extracurricular" />

        @if (loading()) {
          <div class="grid gap-4 md:grid-cols-2">
            @for (i of [0,1]; track i) { <div class="h-32 animate-pulse rounded-2xl bg-surface"></div> }
          </div>
        } @else if (items().length === 0) {
          <p class="text-muted">Nothing here yet.</p>
        } @else {
          <div class="grid gap-4 md:grid-cols-2">
            @for (item of items(); track item.id; let i = $index) {
              <article appReveal [delay]="(i % 2) * 90"
                class="rounded-2xl border border-line bg-bg p-6 transition-colors hover:border-accent/50">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>
                  </span>
                  <div>
                    <h3 class="font-display font-semibold">{{ item.title }}</h3>
                    <p class="text-sm text-muted">
                      @if (item.role) { {{ item.role }} }
                      @if (item.organization) { · {{ item.organization }} }
                    </p>
                  </div>
                </div>
                <p class="mt-3 font-mono text-xs text-accentstrong">
                  {{ fmt(item.startDate) }} — {{ fmt(item.endDate) }}
                </p>
                @if (item.description) {
                  <p class="mt-3 text-sm leading-relaxed text-muted">{{ item.description }}</p>
                }
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class ExtracurricularSection {
  private readonly service = inject(ExtracurricularService);
  readonly loading = signal(true);
  readonly items = signal<Activity[]>([]);

  constructor() {
    this.service.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  fmt = monthYear;
}
