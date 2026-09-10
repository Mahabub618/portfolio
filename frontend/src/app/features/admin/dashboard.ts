import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { ProfileStore } from '../../core/profile-store';
import { BlogSummary, Page, Project } from '../../core/models';
import {
  AchievementsService,
  BlogsService,
  EducationService,
  ExtracurricularService,
  ProjectsService,
} from '../../core/services';

interface Tile {
  label: string;
  count: string;
  link: string;
  icon: string;
}

interface Health {
  status: string;
  db: string;
}

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header>
      <h2 class="font-display text-2xl font-bold">Dashboard</h2>
      <p class="mt-1 text-sm text-muted">
        Signed in as <span class="font-mono text-accent">{{ profileStore.name() }}</span> —
        everything below is live on the public site.
      </p>
    </header>

    <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
      @for (t of tiles(); track t.label) {
        <a [routerLink]="t.link"
          class="group rounded-2xl border border-line bg-surface/50 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10">
          <div class="flex items-center justify-between">
            <span class="text-lg text-accent" aria-hidden="true">{{ t.icon }}</span>
            @if (t.count === '…') {
              <span class="h-5 w-8 animate-pulse rounded bg-surface"></span>
            } @else {
              <span class="font-display text-2xl font-bold">{{ t.count }}</span>
            }
          </div>
          <p class="mt-3 text-sm font-medium text-muted transition-colors group-hover:text-ink">{{ t.label }}</p>
        </a>
      }
    </div>

    <div class="mt-8 grid gap-4 md:grid-cols-2">
      <section class="rounded-2xl border border-line bg-surface/40 p-5">
        <h3 class="font-display font-semibold">Site health</h3>
        @if (health(); as h) {
          <p class="mt-3 flex items-center gap-2 text-sm text-muted">
            <span class="h-2.5 w-2.5 rounded-full" [class]="h.status === 'ok' ? 'bg-emerald-400' : 'bg-red-500'"></span>
            API <span class="font-mono text-xs">{{ h.status }}</span> · database
            <span class="font-mono text-xs">{{ h.db }}</span>
          </p>
        } @else {
          <p class="mt-3 text-sm text-muted">Checking…</p>
        }
      </section>
      <section class="rounded-2xl border border-line bg-surface/40 p-5">
        <h3 class="font-display font-semibold">Quick actions</h3>
        <div class="mt-3 flex flex-wrap gap-2 text-sm">
          <a routerLink="/admin/projects" class="rounded-xl border border-line px-3.5 py-2 transition-colors hover:border-accent/60">+ Project</a>
          <a routerLink="/admin/blogs" class="rounded-xl border border-line px-3.5 py-2 transition-colors hover:border-accent/60">+ Travel blog</a>
          <a routerLink="/admin/profile" class="rounded-xl border border-line px-3.5 py-2 transition-colors hover:border-accent/60">Edit hero</a>
          <a routerLink="/" target="_blank" rel="noopener" class="rounded-xl border border-line px-3.5 py-2 transition-colors hover:border-accent/60">Open public site ↗</a>
        </div>
      </section>
    </div>
  `,
})
export class AdminDashboard {
  private readonly api = inject(Api);
  private readonly projects = inject(ProjectsService);
  private readonly education = inject(EducationService);
  private readonly achievements = inject(AchievementsService);
  private readonly activities = inject(ExtracurricularService);
  private readonly blogs = inject(BlogsService);
  readonly profileStore = inject(ProfileStore);

  readonly tiles = signal<Tile[]>([
    { label: 'Projects', count: '…', link: '/admin/projects', icon: '▣' },
    { label: 'Education entries', count: '…', link: '/admin/education', icon: '⌂' },
    { label: 'Achievements', count: '…', link: '/admin/achievements', icon: '★' },
    { label: 'Activities', count: '…', link: '/admin/activities', icon: '✦' },
    { label: 'Travel blogs', count: '…', link: '/admin/blogs', icon: '✈' },
    { label: 'Gallery photos', count: '…', link: '/admin/blogs', icon: '◫' },
  ]);
  readonly health = signal<Health | null>(null);

  constructor() {
    this.profileStore.ensureLoaded();
    this.projects.list(1, 1).subscribe((p: Page<Project>) => this.setTile(0, p.total));
    this.education.list().subscribe((e) => this.setTile(1, e.length));
    this.achievements.list().subscribe((a) => this.setTile(2, a.length));
    this.activities.list().subscribe((a) => this.setTile(3, a.length));
    this.blogs.list(1, 50).subscribe((b: Page<BlogSummary>) => {
      this.setTile(4, b.total);
      this.setTile(5, '—');
      // photo count is per-blog; load all and sum
      let photos = 0;
      let done = 0;
      if (b.items.length === 0) this.setTile(5, '0');
      for (const blog of b.items) {
        this.api.get<{ photos: unknown[] }>(`/blogs/${blog.id}`).subscribe((d) => {
          photos += d.photos.length;
          done += 1;
          if (done === b.items.length) this.setTile(5, photos);
        });
      }
    });
    this.api.get<Health>('/health').subscribe({
      next: (h) => this.health.set(h),
      error: () => this.health.set({ status: 'unreachable', db: 'unknown' }),
    });
  }

  private setTile(index: number, count: number | string): void {
    this.tiles.update((t) => t.map((tile, i) => (i === index ? { ...tile, count: String(count) } : tile)));
  }
}
