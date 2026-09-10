import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ProjectsService } from '../../core/services';
import { Project } from '../../core/models';
import { RevealDirective } from '../../shared/reveal';
import { SectionHeading } from '../../shared/section-heading';
import { SmartImage } from '../../shared/smart-image';

@Component({
  imports: [SectionHeading, SmartImage, RevealDirective],
  selector: 'app-projects',
  template: `
    <section id="projects" class="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <app-section-heading index="01" kicker="Work" title="Projects"
        subtitle="Things I have designed, built, and shipped. Filter by stack, open a card for the story." />

      @if (loading()) {
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (i of [0,1,2]; track i) {
            <div class="h-80 animate-pulse rounded-2xl bg-surface"></div>
          }
        </div>
      } @else if (error()) {
        <p class="text-muted">Could not load projects. Is the API running?</p>
      } @else if (projects().length === 0) {
        <p class="text-muted">No projects yet — add some from the admin panel.</p>
      } @else {
        @if (allTags().length > 1) {
          <div class="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter projects by technology">
            <button type="button" (click)="activeTag.set(null)"
              class="rounded-full border px-4 py-1.5 font-mono text-xs transition-colors"
              [class]="activeTag() === null ? 'border-accent bg-accent text-accentink' : 'border-line text-muted hover:text-ink'">
              all
            </button>
            @for (tag of allTags(); track tag) {
              <button type="button" (click)="activeTag.set(tag)"
                class="rounded-full border px-4 py-1.5 font-mono text-xs transition-colors"
                [class]="activeTag() === tag ? 'border-accent bg-accent text-accentink' : 'border-line text-muted hover:text-ink'">
                {{ tag }}
              </button>
            }
          </div>
        }

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (project of filtered(); track project.id; let i = $index) {
            <article appReveal [delay]="(i % 3) * 90">
              <button
                type="button"
                (click)="open(project)"
                class="group h-full w-full overflow-hidden rounded-2xl border border-line bg-surface text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_16px_40px_-16px_var(--glow)]"
              >
                <div class="aspect-[3/2] overflow-hidden">
                  @if (project.thumbnailUrl) {
                    <app-smart-image [src]="project.thumbnailUrl" [alt]="project.thumbnailAlt ?? project.title"
                      imgClass="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  } @else {
                    <div class="flex h-full w-full items-center justify-center bg-surface2 font-mono text-xs text-muted">no image</div>
                  }
                </div>
                <div class="p-5">
                  <h3 class="font-display text-lg font-semibold transition-colors group-hover:text-accentstrong">
                    {{ project.title }}
                  </h3>
                  <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{{ project.description }}</p>
                  <div class="mt-4 flex flex-wrap gap-1.5">
                    @for (tag of project.techTags; track tag) {
                      <span class="rounded-full bg-surface2 px-2.5 py-0.5 font-mono text-[11px] text-muted">{{ tag }}</span>
                    }
                  </div>
                </div>
              </button>
            </article>
          }
        </div>
      }
    </section>

    @if (selected(); as project) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        (click)="close()"
        role="dialog" aria-modal="true" [attr.aria-label]="project.title"
      >
        <div
          class="anim-rise max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-line bg-surface sm:rounded-3xl"
          (click)="$event.stopPropagation()"
        >
          @if (project.thumbnailUrl) {
            <div class="aspect-[16/9] w-full overflow-hidden rounded-t-3xl">
              <app-smart-image [src]="project.thumbnailUrl" [alt]="project.thumbnailAlt ?? project.title" />
            </div>
          }
          <div class="p-7">
            <div class="flex items-start justify-between gap-4">
              <h3 class="font-display text-2xl font-semibold">{{ project.title }}</h3>
              <button type="button" (click)="close()" aria-label="Close details"
                class="rounded-full border border-line p-2 text-muted transition-colors hover:text-ink">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5">
              @for (tag of project.techTags; track tag) {
                <span class="rounded-full bg-surface2 px-2.5 py-0.5 font-mono text-[11px] text-muted">{{ tag }}</span>
              }
            </div>
            <p class="mt-5 leading-relaxed text-muted">{{ project.description }}</p>
            @if (project.longDescription; as long) {
              <p class="mt-4 whitespace-pre-line leading-relaxed">{{ long }}</p>
            }
            <div class="mt-7 flex flex-wrap gap-3">
              @if (project.liveUrl; as live) {
                <a [href]="live" target="_blank" rel="noopener"
                  class="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accentink transition-colors hover:bg-accentstrong">
                  Live demo ↗
                </a>
              }
              @if (project.repoUrl; as repo) {
                <a [href]="repo" target="_blank" rel="noopener"
                  class="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accentstrong">
                  Source code ↗
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class Projects {
  private readonly service = inject(ProjectsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly projects = signal<Project[]>([]);
  readonly activeTag = signal<string | null>(null);
  readonly selected = signal<Project | null>(null);

  readonly allTags = computed(() =>
    [...new Set(this.projects().flatMap((p) => p.techTags))].sort(),
  );

  readonly filtered = computed(() => {
    const tag = this.activeTag();
    return tag ? this.projects().filter((p) => p.techTags.includes(tag)) : this.projects();
  });

  constructor() {
    this.service.list(1, 50).subscribe({
      next: (page) => {
        this.projects.set(page.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  open(project: Project): void {
    this.selected.set(project);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.selected.set(null);
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.close();
  }
}
