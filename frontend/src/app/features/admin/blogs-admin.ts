import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { BlogSummary, Page } from '../../core/models';
import { AdminService } from './admin-service';
import { ConfirmService, ToastService } from './admin-kit';

@Component({
  selector: 'app-blogs-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl font-bold">Travel blogs</h2>
        <p class="mt-1 text-sm text-muted">
          Each blog opens its own cinematic gallery page; add photos inside the editor.
        </p>
      </div>
      <button type="button" (click)="createBlog()"
        class="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong">
        <span class="text-base leading-none">+</span> New blog
      </button>
    </header>

    @if (loading()) {
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        @for (i of [0, 1]; track i) { <div class="h-36 animate-pulse rounded-2xl bg-surface"></div> }
      </div>
    } @else if (blogs().length === 0) {
      <div class="mt-8 rounded-2xl border border-dashed border-line bg-surface/40 p-12 text-center">
        <p class="text-muted">No travel blogs yet.</p>
      </div>
    } @else {
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        @for (b of blogs(); track b.id) {
          <article class="group overflow-hidden rounded-2xl border border-line bg-surface/40 transition-colors hover:border-accent/50">
            <div class="relative h-32 overflow-hidden bg-bg">
              @if (b.coverPhotoUrl) {
                <img [src]="b.coverPhotoUrl" [alt]="b.coverPhotoAlt ?? b.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              } @else {
                <div class="flex h-full items-center justify-center font-mono text-xs text-muted">no cover yet</div>
              }
              <span class="absolute right-3 top-3 rounded-lg bg-black/60 px-2 py-1 font-mono text-[10px] text-white backdrop-blur">
                #{{ b.displayOrder }}
              </span>
            </div>
            <div class="p-4">
              <h3 class="font-display font-semibold">{{ b.title }}</h3>
              <p class="mt-0.5 font-mono text-xs text-muted">
                {{ b.location ?? '—' }} · {{ b.blogDate ?? 'no date' }}
              </p>
              <div class="mt-3 flex gap-2">
                <a [routerLink]="['/admin/blogs', b.id]"
                  class="rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/60 hover:text-accent">
                  Edit photos →
                </a>
                <a [routerLink]="['/travel', b.id]" target="_blank" rel="noopener"
                  class="rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/60">
                  Preview ↗
                </a>
                <button type="button" (click)="deleteBlog(b)"
                  class="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10">
                  Delete
                </button>
              </div>
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class BlogsAdmin {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  readonly blogs = signal<BlogSummary[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.admin.get<Page<BlogSummary>>('/blogs?page=1&size=50').subscribe({
      next: (p) => {
        this.blogs.set(p.items);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toast.err(err.error?.error?.message ?? 'Failed to load blogs');
      },
    });
  }

  createBlog(): void {
    const payload = {
      title: `Untitled trip ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
      location: null,
      blogDate: new Date().toISOString().slice(0, 10),
      coverPhotoUrl: null,
      coverPhotoAlt: null,
      summary: null,
      displayOrder: (this.blogs().length + 1) * 10,
    };
    this.admin.create<{ id: string }>('/blogs', payload).subscribe({
      next: (b) => {
        this.toast.ok('Blog created — add photos next');
        this.router.navigate(['/admin/blogs', b.id]);
      },
      error: (err: HttpErrorResponse) => this.toast.err(err.error?.error?.message ?? 'Create failed'),
    });
  }

  async deleteBlog(b: BlogSummary): Promise<void> {
    const ok = await this.confirm.ask(
      'Delete travel blog?',
      `“${b.title}” and all of its gallery photos will be permanently removed.`,
    );
    if (!ok) return;
    this.admin.remove(`/blogs/${b.id}`).subscribe({
      next: () => {
        this.reload();
        this.toast.ok('Deleted');
      },
      error: (err: HttpErrorResponse) => this.toast.err(err.error?.error?.message ?? 'Delete failed'),
    });
  }
}
