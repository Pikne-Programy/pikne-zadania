import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { AccountService, isAccount } from '../account/account.service';
import { ScreenSizes, Sizes } from '../helper/screen-size.service';
import { Tuple } from '../helper/utils';

@Injectable({
  providedIn: 'root',
})
export class NavService implements OnDestroy {
  sideNavOpened = new BehaviorSubject(false);
  showTabs = new BehaviorSubject(false);
  buttonElements = new BehaviorSubject<
    Tuple<string | Function, string, string>[]
  >(loginButtons);

  private eventSubscription: Subscription;
  private accountSubscription: Subscription;
  constructor(private accountService: AccountService) {
    this.accountSubscription = this.accountService
      .getAccount()
      .subscribe((val) => {
        if (val !== null) {
          if (isAccount(val)) this.buttonElements.next(accountButtons);
          else this.accountService.clearCurrentAccount();
        } else this.buttonElements.next(loginButtons);
      });
    this.eventSubscription = fromEvent(window, 'resize').subscribe(() => {
      if (
        window.innerWidth > Sizes[ScreenSizes.TABLET][1] + 1 &&
        this.sideNavOpened.getValue()
      )
        this.toggleSidenav();
    });
  }

  ngOnDestroy() {
    this.accountSubscription.unsubscribe();
    this.eventSubscription.unsubscribe();
    this.sideNavOpened.complete();
    this.showTabs.complete();
    this.buttonElements.complete();
  }

  toggleSidenav() {
    this.sideNavOpened.next(!this.sideNavOpened.getValue());
  }

  static logout(navService: NavService, router: Router) {
    //TODO Logout
    console.log('logout');
    navService.accountService.clearCurrentAccount();
    router.navigate(['/']);
  }
}

export const menuElements: Tuple<string, string, null>[] = [
  new Tuple('/public-exercises', 'Baza zadań'),
];
const loginButtons: Tuple<string, string, string>[] = [
  new Tuple('/login', 'Zaloguj', 'button is-primary is-inverted'),
  new Tuple('/register', 'Zarejestruj', 'button is-primary-dark'),
];
const accountButtons: Tuple<string | Function, string, string>[] = [
  new Tuple('/account', 'Moje konto', 'button is-primary is-inverted'),
  new Tuple(NavService.logout, 'Wyloguj', 'button is-primary-dark'),
];
