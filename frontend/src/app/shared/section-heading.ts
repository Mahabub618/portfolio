import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  template: `
    <header class="mb-10 md:mb-14">
      <p class="font-mono text-xs tracking-[0.3em] text-accent uppercase">
        {{ index() }} · {{ kicker() }}
      </p>
      <h2 class="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
        {{ title() }}
      </h2>
      @if (subtitle(); as sub) {
        <p class="mt-4 max-w-2xl text-muted md:text-lg">{{ sub }}</p>
      }
    </header>
  `,
})
export class SectionHeading {
  readonly index = input.required<string>();
  readonly kicker = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
