import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { ScreenSizes, Sizes } from '../helper/screen-size.service';
import { Tuple } from '../helper/utils';

export const menuElements: Tuple<string, string, null>[] = [
  new Tuple('/public-exercises', 'Baza zadań'),
];

export const buttonElements: Tuple<string, string, string>[] = [
  new Tuple('/sign-in', 'Zaloguj', 'button is-primary is-inverted'),
  new Tuple('/register', 'Zarejestruj', 'button is-primary dark'),
];

@Injectable({
  providedIn: 'root',
})
export class NavService {
  sideNavOpened = new BehaviorSubject(false);
  showTabs = new BehaviorSubject(false);

  private eventSubscription: Subscription;
  constructor() {
    this.eventSubscription = fromEvent(window, 'resize').subscribe(() => {
      if (
        window.innerWidth > Sizes[ScreenSizes.TABLET][1] + 1 &&
        this.sideNavOpened.getValue()
      )
        this.toggleSidenav();
    });
  }

  toggleSidenav() {
    this.sideNavOpened.next(!this.sideNavOpened.getValue());
  }
}
