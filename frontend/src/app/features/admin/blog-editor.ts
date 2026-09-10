import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogDetail, BlogPhoto } from '../../core/models';
import { AdminService } from './admin-service';
import { ConfirmService, ToastService } from './admin-kit';

interface PhotoDraft {
  photo: BlogPhoto;
  caption: string;
  altText: string;
  dirty: boolean;
  saving: boolean;
}

@Component({
  selector: 'app-blog-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <div class="space-y-4">
        <div class="h-20 animate-pulse rounded-2xl bg-surface"></div>
        <div class="h-64 animate-pulse rounded-2xl bg-surface"></div>
      </div>
    } @else if (blog(); as b) {
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <a routerLink="/admin/blogs" class="font-mono text-xs text-muted transition-colors hover:text-accent">← all blogs</a>
          <h2 class="mt-1 font-display text-2xl font-bold">{{ b.title }}</h2>
        </div>
        <a [routerLink]="['/travel', b.id]" target="_blank" rel="noopener"
          class="rounded-xl border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent/60">
          Preview gallery ↗
        </a>
      </header>

      <!-- blog meta -->
      <form (submit)="saveMeta(); $event.preventDefault()"
        class="mt-6 rounded-2xl border border-line bg-surface/40 p-6">
        <h3 class="font-display font-semibold">Story details</h3>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <label class="block text-sm">
            <span class="mb-1.5 block font-medium text-muted">Title <span class="text-red-400">*</span></span>
            <input required [value]="meta().title" (input)="setMeta('title', $any($event.target).value)"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
          <label class="block text-sm">
            <span class="mb-1.5 block font-medium text-muted">Location</span>
            <input [value]="meta().location ?? ''" (input)="setMeta('location', $any($event.target).value)"
              placeholder="Khulna, Bangladesh"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
          <label class="block text-sm">
            <span class="mb-1.5 block font-medium text-muted">Trip date</span>
            <input type="date" [value]="meta().blogDate ?? ''" (input)="setMeta('blogDate', $any($event.target).value)"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent" />
          </label>
          <label class="block text-sm">
            <span class="mb-1.5 block font-medium text-muted">Display order</span>
            <input type="number" [value]="meta().displayOrder" (input)="setMeta('displayOrder', $any($event.target).value)"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent" />
          </label>
          <label class="block text-sm md:col-span-2">
            <span class="mb-1.5 block font-medium text-muted">Summary (card text + meta description)</span>
            <textarea rows="3" [value]="meta().summary ?? ''" (input)="setMeta('summary', $any($event.target).value)"
              class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"></textarea>
          </label>
        </div>
        <div class="mt-4 grid items-start gap-4 md:grid-cols-2">
          <div>
            <p class="mb-1.5 text-sm font-medium text-muted">Cover image</p>
            @if (meta().coverPhotoUrl) {
              <img [src]="meta().coverPhotoUrl" [alt]="meta().coverPhotoAlt ?? 'Cover preview'"
                class="h-24 w-40 rounded-xl border border-line object-cover" />
            }
            <input type="file" accept="image/*" (change)="uploadCover($event)"
              class="mt-2 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent" />
            <input [value]="meta().coverPhotoAlt ?? ''" (input)="setMeta('coverPhotoAlt', $any($event.target).value)"
              placeholder="Cover alt text"
              class="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
            <button type="button" (click)="useFirstPhotoAsCover()" [disabled]="photos().length === 0"
              class="mt-2 text-xs text-accent underline-offset-2 hover:underline disabled:opacity-40">
              Use first gallery photo as cover
            </button>
          </div>
          <div class="flex items-end justify-end">
            <button type="submit" [disabled]="savingMeta()"
              class="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong disabled:opacity-50">
              {{ savingMeta() ? 'Saving…' : 'Save details' }}
            </button>
          </div>
        </div>
      </form>

      <!-- photo manager -->
      <section class="mt-6 rounded-2xl border border-line bg-surface/40 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-display font-semibold">Gallery photos</h3>
            <p class="mt-0.5 text-xs text-muted">
              Each photo gets its own caption on the gallery page. JPG / PNG / WebP / GIF, ≤ 5 MB.
            </p>
          </div>
          <label class="cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong">
            {{ uploading() ? 'Uploading…' : '+ Upload photos' }}
            <input type="file" accept="image/*" multiple class="sr-only" (change)="uploadPhotos($event)" />
          </label>
        </div>

        @if (photos().length === 0) {
          <div class="mt-5 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
            No photos yet — upload some and the gallery comes alive.
          </div>
        } @else {
          <ul class="mt-5 space-y-3">
            @for (p of photos(); track p.photo.id; let i = $index) {
              <li class="flex flex-col gap-3 rounded-xl border border-line bg-bg p-3 sm:flex-row sm:items-start">
                <img [src]="p.photo.photoUrl" [alt]="p.altText || p.caption || 'Gallery photo ' + (i + 1)"
                  class="h-20 w-32 shrink-0 rounded-lg border border-line object-cover" loading="lazy" />
                <div class="flex-1 space-y-2">
                  <input [value]="p.caption" placeholder="Caption — the story line under the photo"
                    (input)="editPhoto(i, 'caption', $any($event.target).value)"
                    class="w-full rounded-lg border border-line bg-surface/60 px-3 py-2 text-sm outline-none focus:border-accent" />
                  <input [value]="p.altText" placeholder="Alt text (screen readers)"
                    (input)="editPhoto(i, 'altText', $any($event.target).value)"
                    class="w-full rounded-lg border border-line bg-surface/60 px-3 py-1.5 text-xs outline-none focus:border-accent" />
                </div>
                <div class="flex shrink-0 items-center gap-1.5 self-center">
                  @if (p.dirty) {
                    <button type="button" (click)="savePhoto(i)" [disabled]="p.saving"
                      class="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accentink disabled:opacity-50">
                      {{ p.saving ? '…' : 'Save' }}
                    </button>
                  }
                  <button type="button" (click)="move(i, -1)" [disabled]="i === 0" aria-label="Move earlier"
                    class="rounded-lg border border-line px-2.5 py-1.5 text-xs transition-colors hover:border-accent/60 disabled:opacity-30">↑</button>
                  <button type="button" (click)="move(i, 1)" [disabled]="i === photos().length - 1" aria-label="Move later"
                    class="rounded-lg border border-line px-2.5 py-1.5 text-xs transition-colors hover:border-accent/60 disabled:opacity-30">↓</button>
                  <button type="button" (click)="deletePhoto(i)" aria-label="Delete photo"
                    class="rounded-lg border border-line px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10">✕</button>
                </div>
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
})
export class BlogEditor {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly blog = signal<BlogDetail | null>(null);
  readonly meta = signal<Partial<BlogDetail>>({});
  readonly photos = signal<PhotoDraft[]>([]);
  readonly savingMeta = signal(false);
  readonly uploading = signal(false);

  private blogId = '';

  constructor() {
    this.blogId = this.route.snapshot.paramMap.get('id') ?? '';
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.admin.get<BlogDetail>(`/blogs/${this.blogId}`).subscribe({
      next: (b) => {
        this.blog.set(b);
        this.meta.set({ ...b });
        this.photos.set(
          b.photos.map((p) => ({ photo: p, caption: p.caption ?? '', altText: p.altText ?? '', dirty: false, saving: false })),
        );
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/admin/blogs']),
    });
  }

  setMeta(key: string, value: unknown): void {
    this.meta.update((m) => ({ ...m, [key]: value }));
  }

  saveMeta(): void {
    const m = this.meta();
    if (!m.title?.trim()) {
      this.toast.err('Title is required');
      return;
    }
    const payload = {
      title: m.title.trim(),
      location: m.location || null,
      blogDate: m.blogDate || null,
      coverPhotoUrl: m.coverPhotoUrl || null,
      coverPhotoAlt: m.coverPhotoAlt || null,
      summary: m.summary || null,
      displayOrder: Number(m.displayOrder ?? 0),
    };
    this.savingMeta.set(true);
    this.admin.update<BlogDetail>(`/blogs/${this.blogId}`, payload).subscribe({
      next: (b) => {
        this.savingMeta.set(false);
        this.blog.set(b);
        this.meta.set({ ...b });
        this.toast.ok('Details saved');
      },
      error: (err: HttpErrorResponse) => {
        this.savingMeta.set(false);
        this.toast.err(err.error?.error?.message ?? 'Save failed');
      },
    });
  }

  uploadCover(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.admin.upload(file).subscribe({
      next: (res) => {
        this.setMeta('coverPhotoUrl', res.url);
        this.toast.ok('Cover uploaded — save details to apply');
      },
      error: (err: HttpErrorResponse) =>
        this.toast.err(err.error?.error?.message ?? 'Upload failed (max 5 MB)'),
    });
  }

  useFirstPhotoAsCover(): void {
    const first = this.photos()[0];
    if (first) this.setMeta('coverPhotoUrl', first.photo.photoUrl);
  }

  uploadPhotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;
    this.uploading.set(true);
    let nextOrder = this.photos().length + 1;
    let queue = files.length;
    let failures = 0;
    for (const file of files) {
      this.admin.upload(file).subscribe({
        next: (res) => {
          const order = nextOrder++;
          this.admin
            .create<BlogPhoto>(`/blogs/${this.blogId}/photos`, {
              photoUrl: res.url,
              altText: null,
              caption: null,
              displayOrder: order,
            })
            .subscribe({
              next: (photo) => {
                this.photos.update((ps) => [...ps, { photo, caption: '', altText: '', dirty: false, saving: false }]);
                if (--queue === 0) this.finishUpload(failures);
              },
              error: () => {
                failures++;
                if (--queue === 0) this.finishUpload(failures);
              },
            });
        },
        error: (err: HttpErrorResponse) => {
          failures++;
          this.toast.err(`${file.name}: ${err.error?.error?.message ?? 'upload failed'}`);
          if (--queue === 0) this.finishUpload(failures);
        },
      });
    }
  }

  private finishUpload(failures: number): void {
    this.uploading.set(false);
    if (failures === 0) this.toast.ok('Photos added — add captions');
  }

  editPhoto(i: number, field: 'caption' | 'altText', value: string): void {
    this.photos.update((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, [field]: value, dirty: true } : p)),
    );
  }

  savePhoto(i: number): void {
    const p = this.photos()[i];
    this.photos.update((ps) => ps.map((x, idx) => (idx === i ? { ...x, saving: true } : x)));
    this.admin
      .update<BlogPhoto>(`/blogs/${this.blogId}/photos/${p.photo.id}`, {
        photoUrl: p.photo.photoUrl,
        altText: p.altText || null,
        caption: p.caption || null,
        displayOrder: p.photo.displayOrder,
      })
      .subscribe({
        next: (updated) => {
          this.photos.update((ps) =>
            ps.map((x, idx) => (idx === i ? { ...x, photo: updated, dirty: false, saving: false } : x)),
          );
          this.toast.ok('Photo updated');
        },
        error: (err: HttpErrorResponse) => {
          this.photos.update((ps) => ps.map((x, idx) => (idx === i ? { ...x, saving: false } : x)));
          this.toast.err(err.error?.error?.message ?? 'Save failed');
        },
      });
  }

  move(i: number, dir: -1 | 1): void {
    const j = i + dir;
    const ps = [...this.photos()];
    if (j < 0 || j >= ps.length) return;
    [ps[i], ps[j]] = [ps[j], ps[i]];
    this.photos.set(ps);
    const orderedIds = ps.map((p) => p.photo.id);
    this.admin.patch(`/blogs/${this.blogId}/photos/reorder`, { orderedIds }).subscribe({
      next: () => this.toast.ok('Order updated'),
      error: (err: HttpErrorResponse) => {
        this.toast.err(err.error?.error?.message ?? 'Reorder failed');
        this.reload();
      },
    });
  }

  async deletePhoto(i: number): Promise<void> {
    const p = this.photos()[i];
    const ok = await this.confirm.ask('Delete photo?', 'This removes it from the gallery permanently.');
    if (!ok) return;
    this.admin.remove(`/blogs/${this.blogId}/photos/${p.photo.id}`).subscribe({
      next: () => {
        this.photos.update((ps) => ps.filter((_, idx) => idx !== i));
        this.toast.ok('Photo deleted');
      },
      error: (err: HttpErrorResponse) => this.toast.err(err.error?.error?.message ?? 'Delete failed'),
    });
  }
}
