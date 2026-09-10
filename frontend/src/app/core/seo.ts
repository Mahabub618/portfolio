import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  set(opts: { title: string; description?: string; image?: string | null }): void {
    this.title.setTitle(opts.title);
    if (opts.description) {
      this.meta.updateTag({ name: 'description', content: opts.description });
      this.meta.updateTag({ property: 'og:description', content: opts.description });
    }
    this.meta.updateTag({ property: 'og:title', content: opts.title });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (opts.image) {
      this.meta.updateTag({ property: 'og:image', content: opts.image });
    } else {
      this.meta.removeTag("property='og:image'");
    }
  }
}
