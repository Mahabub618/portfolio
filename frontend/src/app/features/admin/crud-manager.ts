import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from './admin-service';
import { ConfirmService, ToastService } from './admin-kit';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'tags' | 'url';
  required?: boolean;
  full?: boolean;
  hint?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'datetime' | 'tags' | 'number';
}

type Row = Record<string, unknown> & { id: string };

/**
 * Generic list + modal-form CRUD screen. Drives projects / education /
 * achievements / extracurricular with one component; field descriptors
 * come from each page.
 */
@Component({
  selector: 'app-crud-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl font-bold">{{ title() }}</h2>
        @if (subtitle(); as sub) {
          <p class="mt-1 text-sm text-muted">{{ sub }}</p>
        }
      </div>
      <button type="button" (click)="openCreate()"
        class="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong">
        <span class="text-base leading-none">+</span> New {{ singular() }}
      </button>
    </header>

    @if (loading()) {
      <div class="mt-8 space-y-3">
        @for (i of [0, 1, 2]; track i) {
          <div class="h-14 animate-pulse rounded-xl bg-surface"></div>
        }
      </div>
    } @else if (items().length === 0) {
      <div class="mt-8 rounded-2xl border border-dashed border-line bg-surface/40 p-12 text-center">
        <p class="text-muted">Nothing here yet — create the first {{ singular() }}.</p>
      </div>
    } @else {
      <div class="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="border-b border-line bg-bg/30 text-xs uppercase tracking-wider text-muted">
            <tr>
              @for (c of columns(); track c.key) {
                <th class="px-4 py-3 font-medium first:pl-5">{{ c.label }}</th>
              }
              <th class="px-4 py-3 text-right font-medium">Order</th>
              <th class="sticky right-0 bg-surface px-5 py-3 text-right font-medium shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.45)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (row of items(); track row.id) {
              <tr class="border-b border-line/60 last:border-0 transition-colors hover:bg-bg/40">
                @for (c of columns(); track c.key) {
                  <td class="max-w-72 truncate px-4 py-3.5 first:pl-5">
                    @switch (c.type) {
                      @case ('tags') {
                        <span class="flex flex-wrap gap-1">
                          @for (t of asTags(row[c.key]); track $index) {
                            <span class="rounded-md bg-accent/12 px-1.5 py-0.5 font-mono text-[11px] text-accent">{{ t }}</span>
                          }
                        </span>
                      }
                      @case ('date') {
                        <span class="font-mono text-xs text-muted">{{ row[c.key] ?? '—' }}</span>
                      }
                      @case ('datetime') {
                        <span class="font-mono text-xs text-muted">{{ fmtDT(row[c.key]) }}</span>
                      }
                      @default { {{ row[c.key] ?? '—' }} }
                    }
                  </td>
                }
                <td class="px-4 py-3.5 font-mono text-xs text-muted">{{ row['displayOrder'] }}</td>
                <td class="sticky right-0 whitespace-nowrap bg-surface px-5 py-3.5 text-right shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.45)]">
                  <button type="button" (click)="openEdit(row)" aria-label="Edit"
                    class="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-accent/60 hover:text-accent">
                    Edit
                  </button>
                  <button type="button" (click)="deleteRow(row)" aria-label="Delete"
                    class="ml-2 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10">
                    Delete
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (editing() !== undefined) {
      <div class="admin-modal-overlay fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-5 pt-[8vh] backdrop-blur-sm"
        (click)="close()" (keydown.escape)="close()">
        <div #panel class="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-2xl"
          (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h3 class="font-display text-lg font-semibold">
              {{ editing() === null ? 'New ' + singular() : 'Edit ' + singular() }}
            </h3>
            <button type="button" (click)="close()" aria-label="Close"
              class="rounded-lg border border-line px-2 py-1 text-sm text-muted transition-colors hover:border-accent/50 hover:text-ink">✕</button>
          </div>
          <form (submit)="save(); $event.preventDefault()" class="grid grid-cols-2 gap-x-4 gap-y-4 px-6 py-5">
            @for (f of fields(); track f.key) {
              <label class="block text-sm" [class.col-span-2]="f.full || f.type === 'textarea' || f.type === 'tags'">
                <span class="mb-1.5 block font-medium text-muted">
                  {{ f.label }} @if (f.required) { <span class="text-red-400">*</span> }
                </span>
                @switch (f.type) {
                  @case ('textarea') {
                    <textarea rows="4" [value]="str(f.key)" (input)="setField(f.key, $any($event.target).value)"
                      [required]="f.required"
                      class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"></textarea>
                  }
                  @case ('number') {
                    <input type="number" [value]="num(f.key)" (input)="setField(f.key, $any($event.target).value)"
                      class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm outline-none transition-colors focus:border-accent" />
                  }
                  @case ('date') {
                    <input type="date" [value]="str(f.key)" (input)="setField(f.key, $any($event.target).value)"
                      class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm outline-none transition-colors focus:border-accent" />
                  }
                  @default {
                    <input [type]="f.type === 'url' ? 'url' : 'text'" [value]="str(f.key)"
                      (input)="setField(f.key, $any($event.target).value)" [required]="f.required"
                      class="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent" />
                  }
                }
                @if (f.hint) { <span class="mt-1 block text-xs text-muted/70">{{ f.hint }}</span> }
              </label>
            }
            <div class="col-span-2 mt-2 flex justify-end gap-3 border-t border-line pt-4">
              <button type="button" (click)="close()"
                class="rounded-xl border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent/50">
                Cancel
              </button>
              <button type="submit" [disabled]="saving()"
                class="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accentink shadow-lg shadow-accent/25 transition-all hover:bg-accentstrong disabled:opacity-50">
                {{ saving() ? 'Saving…' : 'Save ' + singular() }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class CrudManager {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly singular = input.required<string>();
  /** API path, e.g. '/projects' */
  readonly path = input.required<string>();
  readonly fields = input.required<FieldDef[]>();
  readonly columns = input.required<ColumnDef[]>();

  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly items = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  /** null = create mode, object = edit mode, undefined = closed */
  readonly editing = signal<Row | null | undefined>(undefined);
  readonly draft = signal<Record<string, unknown>>({});

  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

  constructor() {
    // Input signals are not yet available in the constructor (NG0950),
    // so the first load is driven by an effect.
    effect(() => {
      const path = this.path();
      if (!path) return;
      this.reload();
    });
  }

  reload(): void {
    const path = this.path();
    if (!path) return;
    this.loading.set(true);
    this.admin.list<Row>(path).subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toast.err(err.error?.error?.message ?? 'Failed to load');
      },
    });
  }

  openCreate(): void {
    const blank: Record<string, unknown> = {};
    for (const f of this.fields()) {
      blank[f.key] = f.type === 'number' ? 0 : '';
    }
    blank['displayOrder'] = (this.items().length + 1) * 10;
    this.draft.set(blank);
    this.editing.set(null);
    this.focusFirst();
  }

  openEdit(row: Row): void {
    const d: Record<string, unknown> = {};
    for (const f of this.fields()) {
      const v = row[f.key];
      if (f.type === 'tags') d[f.key] = Array.isArray(v) ? (v as string[]).join(', ') : '';
      else if (f.type === 'date') d[f.key] = (v as string) ?? '';
      else d[f.key] = v ?? '';
    }
    d['displayOrder'] = row['displayOrder'] ?? 0;
    this.draft.set(d);
    this.editing.set(row);
    this.focusFirst();
  }

  close(): void {
    this.editing.set(undefined);
  }

  setField(key: string, value: unknown): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  str(key: string): string {
    const v = this.draft()[key];
    return v === null || v === undefined ? '' : String(v);
  }

  num(key: string): number {
    const v = this.draft()[key];
    return typeof v === 'number' ? v : Number(v ?? 0);
  }

  fmtDT(v: unknown): string {
    if (!v) return '—';
    return new Date(String(v)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  asTags(v: unknown): string[] {
    return Array.isArray(v) ? (v as string[]) : [];
  }

  save(): void {
    const draft = this.draft();
    for (const f of this.fields()) {
      if (f.required && !`${draft[f.key] ?? ''}`.trim()) {
        this.toast.err(`“${f.label}” is required`);
        return;
      }
    }
    const payload: Record<string, unknown> = {};
    for (const f of this.fields()) {
      const raw = draft[f.key];
      if (f.type === 'tags') {
        payload[f.key] = `${raw ?? ''}`
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (f.type === 'number') {
        payload[f.key] = raw === '' || raw === null ? null : Number(raw);
      } else {
        const s = `${raw ?? ''}`.trim();
        payload[f.key] = s === '' ? null : s;
      }
    }
    payload['displayOrder'] =
      draft['displayOrder'] === '' || draft['displayOrder'] === null
        ? 0
        : Number(draft['displayOrder']);

    this.saving.set(true);
    const editing = this.editing();
    const req = editing ? this.admin.update(this.path() + '/' + editing.id, payload) : this.admin.create(this.path(), payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.reload();
        this.toast.ok(editing ? 'Updated' : 'Created');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.err(err.error?.error?.message ?? 'Save failed');
      },
    });
  }

  async deleteRow(row: Row): Promise<void> {
    const ok = await this.confirm.ask(
      `Delete ${this.singular()}?`,
      `“${row['title'] ?? row['institution'] ?? row['category'] ?? row.id}” will be permanently removed.`,
    );
    if (!ok) return;
    this.admin.remove(`${this.path()}/${row.id}`).subscribe({
      next: () => {
        this.reload();
        this.toast.ok('Deleted');
      },
      error: (err: HttpErrorResponse) => this.toast.err(err.error?.error?.message ?? 'Delete failed'),
    });
  }

  private focusFirst(): void {
    setTimeout(() => {
      this.panel?.nativeElement.querySelector<HTMLElement>('input, textarea, select')?.focus();
    }, 0);
  }
}
