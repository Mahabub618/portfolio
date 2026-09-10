import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  inject,
  signal,
} from '@angular/core';


export interface ToastMsg {
  id: number;
  text: string;
  kind: 'ok' | 'err';
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly _toasts = signal<ToastMsg[]>([]);
  readonly toasts = this._toasts.asReadonly();

  ok(text: string): void {
    this.push(text, 'ok');
  }
  err(text: string): void {
    this.push(text, 'err');
  }
  dismiss(id: number): void {
    this._toasts.update((t) => t.filter((x) => x.id !== id));
  }
  private push(text: string, kind: 'ok' | 'err'): void {
    const id = ++this.seq;
    this._toasts.update((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-80 flex-col gap-2" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <button
          type="button"
          (click)="toasts.dismiss(t.id)"
          class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm shadow-2xl backdrop-blur transition-all"
          [class]="
            t.kind === 'ok'
              ? 'border-accent/40 bg-surface/95 text-ink'
              : 'border-red-500/40 bg-surface/95 text-red-400'
          "
        >
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            [class]="t.kind === 'ok' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'"
          >
            {{ t.kind === 'ok' ? '✓' : '!' }}
          </span>
          <span class="flex-1">{{ t.text }}</span>
        </button>
      }
    </div>
  `,
})
export class ToastHost {
  readonly toasts = inject(ToastService);
}

/* ------------------------------------------------------------------ */
/* Confirm dialog                                                      */
/* ------------------------------------------------------------------ */

interface ConfirmRequest {
  title: string;
  message: string;
  okLabel: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _request = signal<ConfirmRequest | null>(null);
  readonly request = this._request.asReadonly();
  private resolver?: (v: boolean) => void;

  ask(title: string, message: string, okLabel = 'Delete'): Promise<boolean> {
    this._request.set({ title, message, okLabel });
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  answer(value: boolean): void {
    this.resolver?.(value);
    this.resolver = undefined;
    this._request.set(null);
  }
}

@Component({
  selector: 'app-confirm-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.request(); as req) {
      <div
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
        (click)="confirm.answer(false)"
        (keydown.escape)="confirm.answer(false)"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="req.title"
          class="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="font-display text-lg font-semibold">{{ req.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ req.message }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              (click)="confirm.answer(false)"
              class="rounded-xl border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent/50"
            >
              Cancel
            </button>
            <button
              type="button"
              autofocus
              (click)="confirm.answer(true)"
              class="rounded-xl bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              {{ req.okLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmHost {
  readonly confirm = inject(ConfirmService);
}
