import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** Mouse drag-to-scroll for horizontal strips (touch keeps native scrolling). */
@Directive({ selector: '[appDragScroll]' })
export class DragScrollDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragging = false;
  private dragged = false;
  private startX = 0;
  private startScrollLeft = 0;

  @HostListener('pointerdown', ['$event'])
  onDown(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.dragging = true;
    this.dragged = false;
    this.startX = event.clientX;
    this.startScrollLeft = this.el.nativeElement.scrollLeft;
    this.el.nativeElement.setPointerCapture(event.pointerId);
    this.el.nativeElement.style.cursor = 'grabbing';
  }

  @HostListener('pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (!this.dragging) return;
    const dx = event.clientX - this.startX;
    if (Math.abs(dx) > 6) this.dragged = true;
    this.el.nativeElement.scrollLeft = this.startScrollLeft - dx;
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  onUp(): void {
    this.dragging = false;
    this.el.nativeElement.style.cursor = '';
  }

  /** Suppress the click that follows a drag so cards don't open accidentally. */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.dragged) {
      event.preventDefault();
      event.stopPropagation();
      this.dragged = false;
    }
  }
}
