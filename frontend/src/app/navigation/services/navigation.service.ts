import { Injectable, OnDestroy } from '@angular/core';
import { Params, QueryParamsHandling, Router } from '@angular/router';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { Role, RoleGuardService } from 'src/app/guards/role-guard.service';
import { AccountService } from '../../account/account.service';
import { ScreenSizes, Sizes } from '../../helper/screen-size.service';
import { Pair } from '../../helper/utils';

export enum ButtonFunctionType {
  DEFAULT,
  LOGOUT,
}

export class ButtonElement {
  /**
   * @param text Text displayed on the button
   * @param classes CSS classes applied to the button
   * @param click Type of the function executed on click
   * @param path Path to navigate to (required when click is DEFAULT)
   */
  constructor(
    public text: string,
    public classes: string,
    public click: ButtonFunctionType,
    public path?: string
  ) {}

  onDefaultClick(
    router: Router,
    queryParams: Params | null | undefined,
    queryParamsHandling: QueryParamsHandling | null | undefined
  ) {
    if (this.path)
      router.navigate([this.path], {
        queryParams: queryParams,
        queryParamsHandling: queryParamsHandling,
      });
  }
}

@Injectable({
  providedIn: 'root',
})
export class NavService implements OnDestroy {
  sideNavOpened = new BehaviorSubject(false);
  showTabs = new BehaviorSubject(false);
  menuElements = new BehaviorSubject<Pair<string, string>[]>(menuElements);
  buttonElements = new BehaviorSubject<ButtonElement[]>(loginButtons);

  private event$: Subscription;
  private account$?: Subscription;
  constructor(private accountService: AccountService) {
    this.accountService.getAccount().then((account) => {
      this.account$ = account.observable.subscribe((val) => {
        this.menuElements.next(
          val
            ? RoleGuardService.getRole(val) === Role.USER
              ? userElements
              : teacherMenuElements
            : menuElements
        );
        this.buttonElements.next(val ? accountButtons : loginButtons);
      });
    });
    this.event$ = fromEvent(window, 'resize').subscribe(() => {
      if (
        window.innerWidth > Sizes[ScreenSizes.TABLET][1] + 1 &&
        this.sideNavOpened.getValue()
      )
        this.toggleSidenav();
    });
  }

  ngOnDestroy() {
    this.account$?.unsubscribe();
    this.event$.unsubscribe();
    this.sideNavOpened.complete();
    this.showTabs.complete();
    this.buttonElements.complete();
  }

  toggleSidenav() {
    this.sideNavOpened.next(!this.sideNavOpened.getValue());
  }
}

const menuElements: Pair<string, string>[] = [
  new Pair('/public-exercises', 'Baza zadań'),
  new Pair('/about', 'O projekcie'),
];
const userElements: Pair<string, string>[] = createUserMenuElements();
const teacherMenuElements: Pair<string, string>[] = createTeacherMenuElements();
function createUserMenuElements() {
  const list = menuElements.concat([]);
  const last = list.pop()!!;
  //NOTE User specific menu elements
  return list.concat([new Pair('/user/achievements', 'Osiągnięcia')], last);
}
function createTeacherMenuElements() {
  const list = menuElements.concat([]);
  const last = list.pop()!!;
  //NOTE Teacher specific menu elements
  return list.concat(
    [
      new Pair('/user/teams', 'Klasy'),
      new Pair('/user/achievements', 'Osiągnięcia'),
    ],
    last
  );
}

const loginButtons: ButtonElement[] = [
  new ButtonElement(
    'Zaloguj',
    'is-primary is-inverted',
    ButtonFunctionType.DEFAULT,
    '/login'
  ),
  new ButtonElement(
    'Zarejestruj',
    'is-primary-dark',
    ButtonFunctionType.DEFAULT,
    '/register'
  ),
];
const accountButtons: ButtonElement[] = [
  new ButtonElement(
    'Moje konto',
    'is-primary is-inverted',
    ButtonFunctionType.DEFAULT,
    '/user'
  ),
  new ButtonElement('Wyloguj', 'is-primary-dark', ButtonFunctionType.LOGOUT),
];

export function executeButtonClick(
  buttonElement: ButtonElement,
  router: Router,
  accountService: AccountService
) {
  switch (buttonElement.click) {
    case ButtonFunctionType.DEFAULT:
      const url = router.routerState.snapshot.url;
      buttonElement.onDefaultClick(
        router,
        url !== '/public-exercises' ? { returnUrl: url } : undefined,
        undefined
      );
      break;
    case ButtonFunctionType.LOGOUT:
      accountService.logout();
      break;
  }
}
