import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Cta, Profile } from '../../core/models';
import { ProfileStore } from '../../core/profile-store';
import { AdminService } from './admin-service';
import { ToastService } from './admin-kit';

interface LinkRow {
  key: string;
  value: string;
}

interface CtaRow extends Cta {}

@Component({
  selector: 'app-profile-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl font-bold">Profile</h2>
        <p class="mt-1 text-sm text-muted">Hero, avatar, banner, social links and CTAs.</p>
      </div>
      <button type="button" (click)="save()" [disabled]="saving() || loading()"
        class="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong disabled:opacity-50">
        {{ saving() ? 'Saving…' : 'Save profile' }}
      </button>
    </header>

    @if (loading()) {
      <div class="mt-8 space-y-4">
        <div class="h-24 animate-pulse rounded-2xl bg-surface"></div>
        <div class="h-64 animate-pulse rounded-2xl bg-surface"></div>
      </div>
    } @else {
      <form (submit)="save(); $event.preventDefault()" class="mt-8 space-y-5">
        <!-- identity -->
        <section class="rounded-2xl border border-line bg-surface/40 p-6">
          <h3 class="font-display font-semibold">Identity</h3>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <label class="block text-sm">
              <span class="mb-1.5 block font-medium text-muted">Name <span class="text-red-400">*</span></span>
              <input required [value]="form().name" (input)="set('name', $any($event.target).value)"
                class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </label>
            <label class="block text-sm">
              <span class="mb-1.5 block font-medium text-muted">Tagline</span>
              <input [value]="form().tagline ?? ''" (input)="set('tagline', $any($event.target).value)"
                class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </label>
            <label class="block text-sm md:col-span-2">
              <span class="mb-1.5 block font-medium text-muted">Intro</span>
              <textarea rows="3" [value]="form().intro ?? ''" (input)="set('intro', $any($event.target).value)"
                class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"></textarea>
            </label>
            <label class="block text-sm">
              <span class="mb-1.5 block font-medium text-muted">Resume URL</span>
              <input type="url" [value]="form().resumeUrl ?? ''" (input)="set('resumeUrl', $any($event.target).value)"
                class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </label>
          </div>
        </section>

        <!-- images -->
        <section class="rounded-2xl border border-line bg-surface/40 p-6">
          <h3 class="font-display font-semibold">Images</h3>
          <p class="mt-1 text-xs text-muted">JPG / PNG / WebP / GIF, max 5 MB.</p>
          <div class="mt-4 grid gap-5 md:grid-cols-2">
            <div class="rounded-xl border border-line bg-bg p-4">
              <p class="text-sm font-medium">Portrait</p>
              @if (form().photoUrl) {
                <img [src]="form().photoUrl" [alt]="form().photoAlt ?? 'Portrait preview'"
                  class="mt-3 h-28 w-28 rounded-xl border border-line object-cover" />
              }
              <input type="file" accept="image/*" (change)="upload($event, 'photoUrl')"
                class="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent" />
              <input [value]="form().photoUrl ?? ''" (input)="set('photoUrl', $any($event.target).value)"
                placeholder="…or paste a URL"
                class="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
              <input [value]="form().photoAlt ?? ''" (input)="set('photoAlt', $any($event.target).value)"
                placeholder="Alt text (accessibility)"
                class="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
            </div>
            <div class="rounded-xl border border-line bg-bg p-4">
              <p class="text-sm font-medium">Hero banner</p>
              @if (form().bannerImageUrl) {
                <img [src]="form().bannerImageUrl" [alt]="form().bannerAlt ?? 'Banner preview'"
                  class="mt-3 h-28 w-full rounded-xl border border-line object-cover" />
              }
              <input type="file" accept="image/*" (change)="upload($event, 'bannerImageUrl')"
                class="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent" />
              <input [value]="form().bannerImageUrl ?? ''" (input)="set('bannerImageUrl', $any($event.target).value)"
                placeholder="…or paste a URL"
                class="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
              <input [value]="form().bannerAlt ?? ''" (input)="set('bannerAlt', $any($event.target).value)"
                placeholder="Alt text (accessibility)"
                class="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
            </div>
          </div>
        </section>

        <!-- social links -->
        <section class="rounded-2xl border border-line bg-surface/40 p-6">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-semibold">Social links</h3>
            <button type="button" (click)="addLink()"
              class="rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/60">+ Add link</button>
          </div>
          <div class="mt-4 space-y-2">
            @for (row of links(); track $index) {
              <div class="flex items-center gap-2">
                <input [value]="row.key" (input)="setLink($index, 'key', $any($event.target).value)"
                  placeholder="github" class="w-32 rounded-xl border border-line bg-bg px-3 py-2 font-mono text-xs outline-none focus:border-accent" />
                <input [value]="row.value" (input)="setLink($index, 'value', $any($event.target).value)"
                  placeholder="https://github.com/…"
                  class="flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
                <button type="button" (click)="removeLink($index)" aria-label="Remove link"
                  class="rounded-lg border border-line px-2.5 py-2 text-xs text-red-400 transition-colors hover:border-red-500/60">✕</button>
              </div>
            }
            @if (links().length === 0) { <p class="text-xs text-muted">No links yet.</p> }
          </div>
        </section>

        <!-- CTAs -->
        <section class="rounded-2xl border border-line bg-surface/40 p-6">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-semibold">Hero call-to-action buttons</h3>
            <button type="button" (click)="addCta()"
              class="rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/60">+ Add CTA</button>
          </div>
          <div class="mt-4 space-y-2">
            @for (cta of ctas(); track $index) {
              <div class="flex flex-wrap items-center gap-2">
                <input [value]="cta.label" (input)="setCta($index, 'label', $any($event.target).value)"
                  placeholder="View my work" class="w-40 rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
                <input [value]="cta.url" (input)="setCta($index, 'url', $any($event.target).value)"
                  placeholder="#projects" class="flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent" />
                <select [value]="cta.style" (change)="setCta($index, 'style', $any($event.target).value)"
                  class="rounded-xl border border-line bg-bg px-3 py-2 text-xs outline-none focus:border-accent">
                  <option value="primary">primary</option>
                  <option value="ghost">ghost</option>
                  <option value="outline">outline</option>
                </select>
                <button type="button" (click)="removeCta($index)" aria-label="Remove CTA"
                  class="rounded-lg border border-line px-2.5 py-2 text-xs text-red-400 transition-colors hover:border-red-500/60">✕</button>
              </div>
            }
            @if (ctas().length === 0) { <p class="text-xs text-muted">No CTAs yet.</p> }
          </div>
        </section>
      </form>
    }
  `,
})
export class ProfileEditor {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly profileStore = inject(ProfileStore);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly form = signal<Partial<Profile>>({});
  readonly links = signal<LinkRow[]>([]);
  readonly ctas = signal<CtaRow[]>([]);

  constructor() {
    this.admin.get<Profile>('/profile').subscribe({
      next: (p) => {
        this.form.set(p);
        this.links.set(Object.entries(p.socialLinks ?? {}).map(([key, value]) => ({ key, value })));
        this.ctas.set((p.ctas ?? []).map((c) => ({ ...c })));
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/admin']),
    });
  }

  set(key: keyof Profile, value: unknown): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  addLink(): void {
    this.links.update((l) => [...l, { key: '', value: '' }]);
  }
  setLink(i: number, part: 'key' | 'value', v: string): void {
    this.links.update((l) => l.map((row, idx) => (idx === i ? { ...row, [part]: v } : row)));
  }
  removeLink(i: number): void {
    this.links.update((l) => l.filter((_, idx) => idx !== i));
  }

  addCta(): void {
    this.ctas.update((c) => [...c, { label: '', url: '', style: 'ghost' }]);
  }
  setCta(i: number, part: 'label' | 'url' | 'style', v: string): void {
    this.ctas.update((c) => c.map((row, idx) => (idx === i ? { ...row, [part]: v } : row)));
  }
  removeCta(i: number): void {
    this.ctas.update((c) => c.filter((_, idx) => idx !== i));
  }

  upload(event: Event, field: 'photoUrl' | 'bannerImageUrl'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.admin.upload(file).subscribe({
      next: (res) => {
        this.set(field, res.url);
        this.toast.ok('Uploaded');
      },
      error: (err: HttpErrorResponse) =>
        this.toast.err(err.error?.error?.message ?? 'Upload failed (max 5 MB)'),
    });
  }

  save(): void {
    const f = this.form();
    if (!f.name?.trim()) {
      this.toast.err('Name is required');
      return;
    }
    const socialLinks: Record<string, string> = {};
    for (const row of this.links()) {
      if (row.key.trim() && row.value.trim()) socialLinks[row.key.trim()] = row.value.trim();
    }
    const ctas = this.ctas().filter((c) => c.label.trim() && c.url.trim());
    const payload = {
      name: f.name!.trim(),
      tagline: f.tagline || null,
      intro: f.intro || null,
      photoUrl: f.photoUrl || null,
      photoAlt: f.photoAlt || null,
      bannerImageUrl: f.bannerImageUrl || null,
      bannerAlt: f.bannerAlt || null,
      socialLinks,
      ctas,
      resumeUrl: f.resumeUrl || null,
    };
    this.saving.set(true);
    this.admin.update<Profile>('/profile', payload).subscribe({
      next: (p) => {
        this.saving.set(false);
        this.form.set(p);
        this.profileStore.refresh();
        this.toast.ok('Profile saved');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.err(err.error?.error?.message ?? 'Save failed');
      },
    });
  }
}
