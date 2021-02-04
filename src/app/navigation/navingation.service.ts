import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Tuple } from '../helper/utils';

export const menuElements: Tuple<string, string, null>[] = [
  new Tuple('public-exercises', 'Baza zadań'),
];

export const buttonElements: Tuple<string, string, string>[] = [
  new Tuple('sign-in', 'Zaloguj', 'button is-primary is-inverted'),
  new Tuple(
    'register',
    'Zarejestruj',
    'button is-primary has-background-primary-dark'
  ),
];

@Injectable({
  providedIn: 'root',
})
export class NavService {
  sideNavOpened = new BehaviorSubject(false);
  showTabs = new BehaviorSubject(false);

  constructor() {}

  toggleSidenav() {
    this.sideNavOpened.next(!this.sideNavOpened.getValue());
  }
}
