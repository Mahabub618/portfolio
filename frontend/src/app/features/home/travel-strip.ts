import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { year } from '../../core/dates';
import { BlogSummary } from '../../core/models';
import { BlogsService } from '../../core/services';
import { DragScrollDirective } from '../../shared/drag-scroll';
import { SectionHeading } from '../../shared/section-heading';
import { SmartImage } from '../../shared/smart-image';

@Component({
  imports: [SectionHeading, SmartImage, RouterLink, DragScrollDirective],
  selector: 'app-travel-strip',
  template: `
    <section id="travel" class="overflow-hidden py-24 md:py-32">
      <div class="mx-auto max-w-6xl px-5">
        <div class="flex items-end justify-between gap-6">
          <app-section-heading index="05" kicker="Field notes" title="Travel Blog"
            subtitle="Photography stories from the road. Drag the strip, or use the arrows — click any card to open the full gallery." />
          <div class="hidden shrink-0 gap-2 pb-12 md:flex">
            <button type="button" (click)="scrollBy(-1)" aria-label="Scroll stories left"
              class="rounded-full border border-line p-3 text-muted transition-colors hover:border-accent hover:text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button type="button" (click)="scrollBy(1)" aria-label="Scroll stories right"
              class="rounded-full border border-line p-3 text-muted transition-colors hover:border-accent hover:text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex gap-5 px-5">
          @for (i of [0,1,2,3]; track i) {
            <div class="h-96 w-72 shrink-0 animate-pulse rounded-2xl bg-surface"></div>
          }
        </div>
      } @else if (blogs().length === 0) {
        <p class="px-5 text-muted">No travel stories yet.</p>
      } @else {
        <div
          #strip
          appDragScroll
          class="strip-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-6 md:px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]"
        >
          @for (blog of blogs(); track blog.id) {
            <a
              [routerLink]="['/travel', blog.id]"
              class="group relative w-72 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-[0_20px_50px_-20px_var(--glow)] sm:w-80"
            >
              <div class="aspect-[4/5] overflow-hidden">
                @if (blog.coverPhotoUrl) {
                  <app-smart-image [src]="blog.coverPhotoUrl" [alt]="blog.coverPhotoAlt ?? blog.title"
                    imgClass="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108" />
                } @else {
                  <div class="h-full w-full bg-surface2"></div>
                }
              </div>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-16">
                <p class="font-mono text-[11px] tracking-widest text-accentstrong uppercase">
                  @if (blog.location) { {{ blog.location }} }@if (blog.blogDate) { · {{ yr(blog.blogDate) }} }
                </p>
                <h3 class="mt-1.5 font-display text-xl font-semibold text-white transition-colors group-hover:text-accentstrong">
                  {{ blog.title }}
                </h3>
              </div>
              <span class="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
              </span>
            </a>
          }
          <div class="w-1 shrink-0" aria-hidden="true"></div>
        </div>
      }
    </section>
  `,
})
export class TravelStrip {
  private readonly service = inject(BlogsService);
  readonly loading = signal(true);
  readonly blogs = signal<BlogSummary[]>([]);
  readonly strip = viewChild<ElementRef<HTMLElement>>('strip');

  constructor() {
    this.service.list(1, 20).subscribe({
      next: (page) => {
        this.blogs.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  yr = year;

  scrollBy(direction: number): void {
    const el = this.strip()?.nativeElement;
    el?.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: 'smooth' });
  }
}
