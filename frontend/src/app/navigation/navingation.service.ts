import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { AccountService, isAccount } from '../account/account.service';
import { ScreenSizes, Sizes } from '../helper/screen-size.service';
import { Tuple } from '../helper/utils';

export enum ButtonFunctionType {
  DEFAULT,
  LOGOUT,
}

export class ButtonElement {
  /**
   * @param text Text displayed on the button
   * @param classes CSS classes applied to the button
   * @param path Path to navigate to (required when click is undefined)
   * @param click Function that is executed on click (when undefined it navigates to provided path)
   */
  constructor(
    public text: string,
    public classes: string,
    public click: ButtonFunctionType,
    public path?: string
  ) {}

  /**
   * Executes provided function or navigates to provided path
   * @param args Arguments for function or navigation parameters (first is Router, second is queryParams, third is queryParamsHandling)
   */
  onDefaultClick(...args: any[]) {
    if (this.path)
      args[0].navigate([this.path], {
        queryParams: args[1],
        queryParamsHandling: args[2],
      });
  }
}

@Injectable({
  providedIn: 'root',
})
export class NavService implements OnDestroy {
  sideNavOpened = new BehaviorSubject(false);
  showTabs = new BehaviorSubject(false);
  buttonElements = new BehaviorSubject<ButtonElement[]>(loginButtons);

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
}

export const menuElements: Tuple<string, string, null>[] = [
  new Tuple('/public-exercises', 'Baza zadań'),
];
const loginButtons: ButtonElement[] = [
  new ButtonElement(
    'Zaloguj',
    'button is-primary is-inverted',
    ButtonFunctionType.DEFAULT,
    '/login'
  ),
  new ButtonElement(
    'Zarejestruj',
    'button is-primary-dark',
    ButtonFunctionType.DEFAULT,
    '/register'
  ),
];
const accountButtons: ButtonElement[] = [
  new ButtonElement(
    'Moje konto',
    'button is-primary is-inverted',
    ButtonFunctionType.DEFAULT,
    '/account'
  ),
  new ButtonElement(
    'Wyloguj',
    'button is-primary-dark',
    ButtonFunctionType.LOGOUT
  ),
];

export function executeButtonClick(
  buttonElement: ButtonElement,
  router: Router,
  accountService: AccountService
) {
  switch (buttonElement.click) {
    case ButtonFunctionType.DEFAULT:
      buttonElement.onDefaultClick(
        router,
        { returnUrl: router.routerState.snapshot.url },
        undefined
      );
      break;
    case ButtonFunctionType.LOGOUT:
      accountService.logout(router);
      break;
  }
}
