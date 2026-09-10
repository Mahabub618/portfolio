import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ProfileStore } from '../../core/profile-store';
import { SmartImage } from '../../shared/smart-image';

@Component({
  imports: [SmartImage],
  selector: 'app-hero',
  template: `
    <section id="home" class="relative flex min-h-svh flex-col justify-center overflow-hidden">
      <!-- banner -->
      <div class="absolute inset-0 -z-10" [style.transform]="'translateY(' + parallax() + 'px)'">
        @if (profile()?.bannerImageUrl; as banner) {
          <app-smart-image
            [src]="banner"
            [alt]="profile()?.bannerAlt ?? ''"
            imgClass="ken-burns h-full w-full object-cover"
            class="h-full w-full"
          />
        } @else {
          <div class="h-full w-full bg-surface2"></div>
        }
        <div class="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/60 to-bg"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--glow),transparent_55%)]"></div>
      </div>

      <div class="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 pt-28 pb-16 md:grid-cols-[1.4fr_1fr] md:pt-20">
        <div>
          <p class="anim-rise font-mono text-xs tracking-[0.35em] text-accent uppercase" style="animation-delay: 0.05s">
            Portfolio
          </p>
          <h1 class="anim-rise mt-4 text-5xl font-bold tracking-tight md:text-7xl" style="animation-delay: 0.15s">
            {{ profile()?.name ?? '…' }}
          </h1>
          @if (profile()?.tagline; as tagline) {
            <p class="anim-rise mt-4 font-display text-xl text-accentstrong md:text-2xl" style="animation-delay: 0.25s">
              {{ tagline }}
            </p>
          }
          @if (profile()?.intro; as intro) {
            <p class="anim-rise mt-6 max-w-xl leading-relaxed text-muted md:text-lg" style="animation-delay: 0.35s">
              {{ intro }}
            </p>
          }

          <div class="anim-rise mt-9 flex flex-wrap items-center gap-4" style="animation-delay: 0.45s">
            @for (cta of profile()?.ctas ?? []; track cta.label) {
              <a
                [href]="cta.url"
                [target]="cta.url.startsWith('http') ? '_blank' : null"
                [rel]="cta.url.startsWith('http') ? 'noopener' : null"
                class="rounded-full px-6 py-3 text-sm font-medium transition-all duration-200"
                [class]="cta.style === 'primary'
                  ? 'bg-accent text-accentink hover:bg-accentstrong hover:shadow-[0_0_28px_var(--glow)]'
                  : 'border border-line text-ink hover:border-accent hover:text-accentstrong'"
              >{{ cta.label }}</a>
            }
          </div>

          @if (socials().length) {
            <div class="anim-rise mt-8 flex flex-wrap gap-3" style="animation-delay: 0.55s">
              @for (entry of socials(); track entry[0]) {
                <a
                  [href]="entry[1]" target="_blank" rel="noopener"
                  class="flex items-center gap-2 rounded-full border border-line bg-surface/60 px-4 py-1.5 text-xs text-muted backdrop-blur transition-colors hover:border-accent hover:text-ink"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                  <span class="font-mono uppercase tracking-wider">{{ entry[0] }}</span>
                </a>
              }
            </div>
          }
        </div>

        @if (profile()?.photoUrl; as photo) {
          <div class="anim-rise mx-auto hidden md:block" style="animation-delay: 0.5s">
            <div class="relative">
              <div class="absolute -inset-3 rounded-full border border-line"></div>
              <div class="absolute -inset-8 rounded-full border border-line/40"></div>
              <app-smart-image
                [src]="photo"
                [alt]="profile()?.photoAlt ?? 'Profile photo'"
                imgClass="h-full w-full object-cover"
                class="relative h-64 w-64 overflow-hidden rounded-full ring-4 ring-accent/40 lg:h-80 lg:w-80"
              />
            </div>
          </div>
        }
      </div>

      <a
        href="#projects"
        class="float-y absolute bottom-8 left-1/2 -translate-x-1/2 text-muted transition-colors hover:text-accent"
        aria-label="Scroll to projects"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </a>
    </section>
  `,
})
export class Hero {
  private readonly store = inject(ProfileStore);
  private readonly scrollY = signal(0);

  readonly parallax = computed(() => Math.min(this.scrollY(), window.innerHeight) * 0.3);

  constructor() {
    this.store.ensureLoaded();
  }

  profile() {
    return this.store.profile();
  }

  socials(): [string, string][] {
    return Object.entries(this.profile()?.socialLinks ?? {});
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollY.set(window.scrollY);
  }
}
