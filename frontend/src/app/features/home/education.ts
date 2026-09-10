import { Component, inject, signal } from '@angular/core';
import { monthYear } from '../../core/dates';
import { EducationEntry } from '../../core/models';
import { EducationService } from '../../core/services';
import { RevealDirective } from '../../shared/reveal';
import { SectionHeading } from '../../shared/section-heading';

@Component({
  imports: [SectionHeading, RevealDirective],
  selector: 'app-education',
  template: `
    <section id="education" class="border-t border-line bg-surface/40">
      <div class="mx-auto max-w-4xl px-5 py-24 md:py-32">
        <app-section-heading index="02" kicker="Background" title="Academic History" />

        @if (loading()) {
          <div class="space-y-6">
            @for (i of [0,1]; track i) {
              <div class="h-28 animate-pulse rounded-2xl bg-surface"></div>
            }
          </div>
        } @else if (entries().length === 0) {
          <p class="text-muted">Nothing here yet.</p>
        } @else {
          <ol class="relative border-l border-line pl-8">
            @for (entry of entries(); track entry.id; let i = $index) {
              <li appReveal [delay]="i * 80" class="relative pb-12 last:pb-0">
                <span class="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-accent bg-bg">
                  <span class="h-2 w-2 rounded-full bg-accent"></span>
                </span>
                <p class="font-mono text-xs tracking-widest text-accent uppercase">
                  {{ fmt(entry.startDate) }} — {{ fmt(entry.endDate) }}
                </p>
                <h3 class="mt-2 font-display text-xl font-semibold">{{ entry.degree }}</h3>
                <p class="mt-1 text-muted">
                  {{ entry.institution }}@if (entry.fieldOfStudy) { · {{ entry.fieldOfStudy }} }
                </p>
                @if (entry.gradeOrGpa) {
                  <p class="mt-2 inline-block rounded-full bg-surface2 px-3 py-1 font-mono text-xs text-accentstrong">
                    {{ entry.gradeOrGpa }}
                  </p>
                }
                @if (entry.description) {
                  <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{{ entry.description }}</p>
                }
              </li>
            }
          </ol>
        }
      </div>
    </section>
  `,
})
export class Education {
  private readonly service = inject(EducationService);
  readonly loading = signal(true);
  readonly entries = signal<EducationEntry[]>([]);

  constructor() {
    this.service.list().subscribe({
      next: (items) => {
        this.entries.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  fmt = monthYear;
}
