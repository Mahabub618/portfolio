import { Component, computed, inject, signal } from '@angular/core';
import { monthYear } from '../../core/dates';
import { Achievement } from '../../core/models';
import { AchievementsService } from '../../core/services';
import { RevealDirective } from '../../shared/reveal';
import { SectionHeading } from '../../shared/section-heading';

const CATEGORY_LABELS: Record<string, string> = {
  'competitive-programming': 'Competitive Programming',
  hackathon: 'Hackathons',
  certification: 'Certifications',
};

@Component({
  imports: [SectionHeading, RevealDirective],
  selector: 'app-achievements',
  template: `
    <section id="achievements" class="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <app-section-heading index="03" kicker="Competitive edge" title="Achievements"
        subtitle="Contest standings, ratings, and wins — pulled straight from the records below." />

      @if (loading()) {
        <div class="grid gap-4 sm:grid-cols-3">
          @for (i of [0,1,2]; track i) { <div class="h-24 animate-pulse rounded-2xl bg-surface"></div> }
        </div>
      } @else if (items().length === 0) {
        <p class="text-muted">No achievements recorded yet.</p>
      } @else {
        <!-- stat highlights computed from the same records -->
        <div class="mb-10 grid gap-4 sm:grid-cols-3">
          @for (stat of stats(); track stat.label) {
            <div appReveal class="rounded-2xl border border-line bg-surface p-5">
              <p class="font-display text-3xl font-bold text-accentstrong">{{ stat.value }}</p>
              <p class="mt-1 font-mono text-[11px] tracking-widest text-muted uppercase">{{ stat.label }}</p>
            </div>
          }
        </div>

        @if (categories().length > 1) {
          <div class="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter achievements by category">
            <button type="button" (click)="activeCategory.set(null)"
              class="rounded-full border px-4 py-1.5 font-mono text-xs transition-colors"
              [class]="activeCategory() === null ? 'border-accent bg-accent text-accentink' : 'border-line text-muted hover:text-ink'">
              all
            </button>
            @for (cat of categories(); track cat) {
              <button type="button" (click)="activeCategory.set(cat)"
                class="rounded-full border px-4 py-1.5 font-mono text-xs transition-colors"
                [class]="activeCategory() === cat ? 'border-accent bg-accent text-accentink' : 'border-line text-muted hover:text-ink'">
                {{ label(cat) }}
              </button>
            }
          </div>
        }

        <div class="grid gap-4 md:grid-cols-2">
          @for (item of filtered(); track item.id; let i = $index) {
            <article appReveal [delay]="(i % 2) * 90"
              class="group rounded-2xl border border-line bg-surface p-6 transition-all duration-300 hover:border-accent/60">
              <div class="flex items-start justify-between gap-3">
                <span class="rounded-full bg-accent/15 px-3 py-1 font-mono text-[11px] tracking-wide text-accentstrong">
                  {{ label(item.category) }}
                </span>
                <span class="font-mono text-xs text-muted">{{ fmt(item.achievedDate) }}</span>
              </div>
              <h3 class="mt-4 font-display text-lg font-semibold">{{ item.title }}</h3>
              <p class="mt-1 text-sm text-muted">
                @if (item.platform) { {{ item.platform }} }
                @if (item.rank) { · Rank {{ item.rank }} }
                @if (item.rating) { · Rating {{ item.rating }} }
              </p>
              @if (item.description) {
                <p class="mt-3 text-sm leading-relaxed text-muted">{{ item.description }}</p>
              }
              @if (item.standingUrl; as url) {
                <a [href]="url" target="_blank" rel="noopener"
                  class="mt-4 inline-block text-sm text-accent transition-colors hover:text-accentstrong">
                  View standings ↗
                </a>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class Achievements {
  private readonly service = inject(AchievementsService);
  readonly loading = signal(true);
  readonly items = signal<Achievement[]>([]);
  readonly activeCategory = signal<string | null>(null);

  readonly categories = computed(() =>
    [...new Set(this.items().map((a) => a.category))].sort(),
  );

  readonly filtered = computed(() => {
    const cat = this.activeCategory();
    return cat ? this.items().filter((a) => a.category === cat) : this.items();
  });

  /** Highlight row derived from the records themselves — never hardcoded. */
  readonly stats = computed(() => {
    const items = this.items();
    const cp = items.filter((a) => a.category === 'competitive-programming');
    const bestRating = cp
      .map((a) => Number.parseFloat(a.rating ?? ''))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => b - a)[0];
    const platforms = new Set(items.map((a) => a.platform).filter((p): p is string => !!p));
    return [
      { label: 'Total achievements', value: `${items.length}` },
      { label: 'Best CP rating', value: bestRating ? `${bestRating}` : '—' },
      { label: 'Platforms', value: `${platforms.size}` },
    ];
  });

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

  label(category: string): string {
    return CATEGORY_LABELS[category] ?? category;
  }
}
