import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, fromEvent } from 'rxjs';

export enum ScreenSizes {
  MOBILE,
  TABLET,
  DESKTOP,
  WIDESCREEN,
  FULL_HD
}

export const SIZES: [ScreenSizes, number][] = [
    [ScreenSizes.MOBILE, 768],
    [ScreenSizes.TABLET, 1023],
    [ScreenSizes.DESKTOP, 1215],
    [ScreenSizes.WIDESCREEN, 1407],
    [ScreenSizes.FULL_HD, -1]
];

@Injectable({
    providedIn: 'root'
})
export class ScreenSizeService implements OnDestroy {
  currentSize = new BehaviorSubject(this.getSize());

  private event$: Subscription;
  constructor() {
      this.event$ = fromEvent(window, 'resize').subscribe(() => this.onResize());
  }

  ngOnDestroy() {
      this.currentSize.complete();
      this.event$.unsubscribe();
  }

  private onResize() {
      const newSize = this.getSize();
      if (this.currentSize.getValue() !== newSize)
          this.currentSize.next(newSize);
  }

  private getSize(): ScreenSizes {
      const windowWidth = window.innerWidth;
      for (const [screenSize, width] of SIZES) {
          if (windowWidth <= width)
              return screenSize;
      }
      return ScreenSizes.FULL_HD;
  }
}
