import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  effect,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { monthYear } from '../../core/dates';
import { BlogDetail as Blog } from '../../core/models';
import { BlogsService } from '../../core/services';
import { SeoService } from '../../core/seo';
import { ProfileStore } from '../../core/profile-store';
import { RevealDirective } from '../../shared/reveal';
import { SmartImage } from '../../shared/smart-image';

type Layout = 'full' | 'left' | 'right';

@Component({
  imports: [RouterLink, SmartImage, RevealDirective],
  selector: 'app-travel-detail',
  template: `
    <!-- fixed back bar -->
    <div class="fixed inset-x-0 top-0 z-40 border-b border-line/50 bg-bg/80 backdrop-blur-md">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
        <a routerLink="/" class="flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span class="hidden sm:inline">Back to portfolio</span>
          <span class="sm:hidden">Back</span>
        </a>
        <p class="min-w-0 truncate font-display text-sm font-medium">{{ blog()?.title }}</p>
        @if (blog(); as b) {
          <p class="font-mono text-xs text-accentstrong" aria-live="polite">
            {{ activeIndex() + 1 }} / {{ b.photos.length }}
          </p>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="min-h-svh">
        <div class="h-svh animate-pulse bg-surface"></div>
        <div class="mx-auto max-w-2xl space-y-4 px-5 py-16">
          <div class="h-4 w-2/3 animate-pulse rounded bg-surface"></div>
          <div class="h-4 animate-pulse rounded bg-surface"></div>
          <div class="h-4 w-5/6 animate-pulse rounded bg-surface"></div>
        </div>
      </div>
    } @else if (error()) {
      <div class="flex min-h-svh flex-col items-center justify-center gap-4 px-5 text-center">
        <p class="font-display text-2xl">This story could not be found.</p>
        <a routerLink="/" class="text-accent hover:text-accentstrong">← Back to portfolio</a>
      </div>
    } @else if (blog(); as b) {
      <!-- cinematic cover -->
      <header class="relative flex min-h-svh items-end overflow-hidden">
        <div class="absolute inset-0 -z-10">
          @if (b.coverPhotoUrl) {
            <app-smart-image [src]="b.coverPhotoUrl" [alt]="b.coverPhotoAlt ?? b.title"
              imgClass="ken-burns h-full w-full object-cover" class="h-full w-full" />
          } @else {
            <div class="h-full w-full bg-surface2"></div>
          }
          <div class="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-bg/20"></div>
        </div>
        <div class="mx-auto w-full max-w-6xl px-5 pb-20 pt-32">
          <p class="anim-rise font-mono text-xs tracking-[0.35em] text-accentstrong uppercase">
            @if (b.location) { {{ b.location }} }@if (b.blogDate) { · {{ fmt(b.blogDate) }} }
          </p>
          <h1 class="anim-rise mt-4 max-w-3xl text-5xl font-bold tracking-tight md:text-7xl" style="animation-delay: 0.12s">
            {{ b.title }}
          </h1>
          @if (b.summary; as summary) {
            <p class="anim-rise mt-6 max-w-xl text-lg leading-relaxed text-muted" style="animation-delay: 0.24s">
              {{ summary }}
            </p>
          }
        </div>
        <span class="float-y absolute bottom-7 left-1/2 -translate-x-1/2 text-muted">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </span>
      </header>

      <!-- the story: alternating full / offset frames -->
      <main class="relative mx-auto max-w-6xl px-5 pb-32">
        @for (photo of b.photos; track photo.id; let i = $index) {
          <figure
            #frame
            [attr.data-frame]="i"
            appReveal
            class="scroll-mt-24"
            [class]="frameClass(i)"
          >
            @if (layout(i) !== 'full') {
              <figcaption [class]="captionClass(i)" [class.order-last]="layout(i) === 'left'">
                <span class="font-mono text-sm text-accent">{{ num(i) }}</span>
                <p class="mt-3 font-display text-xl leading-snug font-medium md:text-2xl">{{ photo.caption }}</p>
                @if (photo.altText; as alt) {
                  <p class="mt-3 text-sm leading-relaxed text-muted">{{ alt }}</p>
                }
                <span class="mt-5 block h-px w-12 bg-accent"></span>
              </figcaption>
            }
            <div class="overflow-hidden rounded-xl border border-line">
              <app-smart-image [src]="photo.photoUrl" [alt]="photo.altText ?? photo.caption ?? 'Travel photo'"
                [imgClass]="imgClass(i)" />
            </div>
            @if (layout(i) === 'full') {
              <figcaption class="mt-4 flex flex-col gap-1 border-t border-line pt-4 sm:flex-row sm:items-baseline sm:gap-6">
                <span class="font-mono text-sm text-accent">{{ num(i) }}</span>
                <p class="max-w-2xl leading-relaxed">{{ photo.caption }}</p>
              </figcaption>
            }
          </figure>
        }

        <div class="mt-24 border-t border-line pt-10 text-center">
          <p class="font-mono text-xs tracking-[0.3em] text-muted uppercase">End of story</p>
          <a routerLink="/" class="mt-5 inline-block rounded-full bg-accent px-7 py-3 text-sm font-medium text-accentink transition-colors hover:bg-accentstrong">
            ← Back to portfolio
          </a>
        </div>
      </main>

      <!-- filmstrip rail (desktop) -->
      <nav class="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex"
           aria-label="Photo navigation">
        @for (photo of b.photos; track photo.id; let i = $index) {
          <button type="button" (click)="scrollToFrame(i)"
            class="rail-tick h-0.5 rounded-full transition-all"
            [class]="i === activeIndex() ? 'w-9 bg-accent' : 'w-4 bg-line hover:bg-muted'"
            [attr.aria-label]="'Go to photo ' + (i + 1)"
            [attr.aria-current]="i === activeIndex() ? 'true' : null">
          </button>
        }
      </nav>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TravelDetailPage {
  private readonly blogs = inject(BlogsService);
  private readonly seo = inject(SeoService);
  private readonly profileStore = inject(ProfileStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Bound from the :id route param via withComponentInputBinding. */
  readonly id = input<string>();

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly blog = signal<Blog | null>(null);
  readonly activeIndex = signal(0);

  /** Live list of rendered frame elements — updates when the story loads. */
  private readonly frameEls = viewChildren<ElementRef<HTMLElement>>('frame');

  private frameObserver?: IntersectionObserver;

  constructor() {
    this.profileStore.ensureLoaded();

    effect(() => {
      const id = this.id();
      if (!id) return;
      this.loading.set(true);
      this.error.set(false);
      this.blogs.get(id).subscribe({
        next: (blog) => {
          this.blog.set(blog);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });

    // SEO reacts to whichever of (blog, profile) arrives last, so the title
    // always ends up "<blog> · <owner name>" even on a cold deep-link.
    effect(() => {
      const blog = this.blog();
      if (!blog) return;
      const owner = this.profileStore.profile()?.name ?? 'Portfolio';
      this.seo.set({
        title: `${blog.title} · ${owner}`,
        description: blog.summary ?? undefined,
        image: blog.coverPhotoUrl,
      });
    });

    // (Re)attach the active-frame observer whenever the rendered frames change.
    effect(() => {
      const frames = this.frameEls();
      this.frameObserver?.disconnect();
      this.activeIndex.set(0);
      if (!frames.length) return;
      this.frameObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.activeIndex.set(Number((entry.target as HTMLElement).dataset['frame'] ?? 0));
            }
          }
        },
        { rootMargin: '-45% 0px -45% 0px' },
      );
      for (const frame of frames) {
        this.frameObserver.observe(frame.nativeElement);
      }
    });

    this.destroyRef.onDestroy(() => this.frameObserver?.disconnect());
  }

  fmt = monthYear;

  layout(i: number): Layout {
    return (['full', 'left', 'right'] as const)[i % 3];
  }

  num(i: number): string {
    return String(i + 1).padStart(2, '0');
  }

  frameClass(i: number): string {
    switch (this.layout(i)) {
      case 'full':
        return 'pt-20';
      case 'left':
        return 'grid items-center gap-8 pt-20 md:grid-cols-[2.2fr_1fr] md:gap-14';
      case 'right':
        return 'grid items-center gap-8 pt-20 md:grid-cols-[1fr_2.2fr] md:gap-14';
    }
  }

  captionClass(i: number): string {
    return this.layout(i) === 'right' ? 'md:pl-6' : 'md:pr-6 md:text-right md:items-end flex flex-col';
  }

  imgClass(i: number): string {
    return this.layout(i) === 'full'
      ? 'h-auto max-h-[80svh] w-full object-cover'
      : 'h-auto w-full object-cover';
  }

  scrollToFrame(index: number): void {
    const frame = this.host.nativeElement.querySelector(`[data-frame="${index}"]`);
    frame?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /** Filmstrip-style stepping with the arrow keys. */
  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    const count = this.blog()?.photos.length ?? 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.scrollToFrame(Math.min(this.activeIndex() + 1, count - 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.scrollToFrame(Math.max(this.activeIndex() - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.scrollToFrame(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.scrollToFrame(count - 1);
    }
  }
}
