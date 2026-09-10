import { Component, input, signal } from '@angular/core';

/**
 * Lazy image with skeleton + blur-up transition.
 * Falls back to the skeleton if the image fails (alt text still conveys meaning).
 */
@Component({
  selector: 'app-smart-image',
  template: `
    <img
      [src]="src()"
      [alt]="alt()"
      loading="lazy"
      decoding="async"
      [class]="imgClass()"
      [class.loaded]="loaded()"
      (load)="loaded.set(true)"
      (error)="failed.set(true)"
    />
    @if (!loaded() && !failed()) {
      <div class="skeleton" aria-hidden="true"></div>
    }
  `,
  host: { class: 'smart-image block' },
})
export class SmartImage {
  readonly src = input.required<string | null>();
  readonly alt = input<string>('');
  readonly imgClass = input<string>('h-full w-full object-cover');
  readonly loaded = signal(false);
  readonly failed = signal(false);
}
