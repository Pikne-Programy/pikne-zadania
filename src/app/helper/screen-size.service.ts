import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, fromEvent } from 'rxjs';

export enum ScreenSizes {
  MOBILE,
  TABLET,
  DESKTOP,
  WIDESCREEN,
  FULL_HD,
}

export const Sizes = [
  [ScreenSizes.MOBILE, 768],
  [ScreenSizes.TABLET, 1023],
  [ScreenSizes.DESKTOP, 1215],
  [ScreenSizes.WIDESCREEN, 1407],
  [ScreenSizes.FULL_HD, -1],
];

@Injectable({
  providedIn: 'root',
})
export class ScreenSizeService implements OnDestroy {
  currentSize = new BehaviorSubject(this.getSize());

  private eventSubscription: Subscription;
  constructor() {
    this.eventSubscription = fromEvent(window, 'resize').subscribe(() =>
      this.onResize()
    );
  }

  ngOnDestroy() {
    this.currentSize.complete();
    this.eventSubscription.unsubscribe();
  }

  private onResize() {
    const newSize = this.getSize();
    if (this.currentSize.getValue() != newSize) this.currentSize.next(newSize);
  }

  private getSize(): number {
    const width = window.innerWidth;
    for (let i = 0; i < Sizes.length; i++)
      if (width <= Sizes[i][1]) return Sizes[i][0];
    return ScreenSizes.FULL_HD;
  }
}
