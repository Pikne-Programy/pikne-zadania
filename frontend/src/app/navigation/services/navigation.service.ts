import { Injectable, OnDestroy } from '@angular/core';
import {
    NavigationEnd,
    Params,
    QueryParamsHandling,
    Router
} from '@angular/router';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Role, RoleGuardService } from 'src/app/guards/role-guard.service';
import { AccountService } from '../../account/account.service';
import { ScreenSizes, SIZES } from '../../helper/screen-size.service';

type QueryParams = 'relative';

export class MenuElement {
    isSelected = false;
    private selectionRegex: RegExp;

    constructor(
        public text: string,
        private mainLink: string,
        private secondaryLink?: string,
        private _queryParams?: QueryParams[]
    ) {
        this.selectionRegex = new RegExp(`^${mainLink}`);
    }

    get link() {
        return this.mainLink + (this.secondaryLink ?? '');
    }

    getQueryParams(returnUrl?: string): Params | undefined {
        if (this._queryParams && returnUrl)
            if (this._queryParams.includes('relative')) return { returnUrl };

        return undefined;
    }

    get queryParamsHandling(): QueryParamsHandling | undefined {
        return this._queryParams ? 'merge' : undefined;
    }

    setSelection(currentUrl: string) {
        const res = this.selectionRegex.exec(currentUrl);
        this.isSelected = res !== null && res.length === 1;
    }
}

export enum ButtonFunctionType {
    DEFAULT,
    LOGOUT
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
        if (this.path) {
            router.navigate([this.path], {
                queryParams,
                queryParamsHandling
            });
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class NavService implements OnDestroy {
    sideNavOpened = new BehaviorSubject(false);
    showTabs = new BehaviorSubject(false);
    /**
     * First - link; Second - text
     */
    menuElements = new BehaviorSubject<MenuElement[]>(menuElements);
    buttonElements = new BehaviorSubject<ButtonElement[]>(loginButtons);

    private event$: Subscription;
    private account$?: Subscription;
    private router$: Subscription;
    constructor(private accountService: AccountService, router: Router) {
        this.accountService.getAccount().then((account) => {
            this.account$ = account.observable.subscribe((val) => {
                this.menuElements.next(
                    val
                        ? RoleGuardService.getRole(val) === Role.USER
                            ? userElements
                            : teacherElements
                        : menuElements
                );
                this.setSelectedMenuElement(router.url);
                this.buttonElements.next(val ? accountButtons : loginButtons);
            });
        });
        this.event$ = fromEvent(window, 'resize').subscribe(() => {
            if (
                window.innerWidth > SIZES[ScreenSizes.TABLET][1] + 1 &&
                this.sideNavOpened.getValue()
            )
                this.toggleSidenav();
        });

        this.setSelectedMenuElement(router.url);
        this.router$ = router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map((event) => event as NavigationEnd)
            )
            .subscribe((event) => {
                this.setSelectedMenuElement(event.urlAfterRedirects);
            });
    }

    setSelectedMenuElement(url: string) {
        const menu = this.menuElements.getValue();
        for (const menuElement of menu) menuElement.setSelection(url);
    }

    ngOnDestroy() {
        this.account$?.unsubscribe();
        this.event$.unsubscribe();
        this.router$.unsubscribe();
        this.sideNavOpened.complete();
        this.showTabs.complete();
        this.buttonElements.complete();
    }

    toggleSidenav() {
        this.sideNavOpened.next(!this.sideNavOpened.getValue());
    }
}

const menuElements: MenuElement[] = [
    new MenuElement('Baza zadań', '/public-exercises'),
    new MenuElement('O projekcie', '/about', undefined, ['relative'])
];
const userElements: MenuElement[] = [
    new MenuElement('Baza zadań', '/public-exercises'),
    new MenuElement('Testy', '/exam'),
    // ['/user/achievements', 'Osiągnięcia'], //TODO Add when ready
    new MenuElement('O projekcie', '/about', undefined, ['relative'])
];
const teacherElements: MenuElement[] = [
    new MenuElement('Baza zadań', '/public-exercises'),
    new MenuElement('Moje zadania', '/subject', '/list'),
    new MenuElement('Klasy', '/user/teams'),
    // ['/user/achievements', 'Osiągnięcia'], //TODO Add when ready
    new MenuElement('O projekcie', '/about', undefined, ['relative'])
];

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
    )
];
const accountButtons: ButtonElement[] = [
    /* new ButtonElement(
        'Moje konto',
        'is-primary is-inverted',
        ButtonFunctionType.DEFAULT,
        '/user'
    ), */
    new ButtonElement('Wyloguj', 'is-primary-dark', ButtonFunctionType.LOGOUT)
];

export function executeButtonClick(
    buttonElement: ButtonElement,
    router: Router,
    accountService: AccountService
) {
    switch (buttonElement.click) {
        case ButtonFunctionType.DEFAULT: {
            const url = router.routerState.snapshot.url;
            buttonElement.onDefaultClick(
                router,
                url !== '/public-exercises' ? { returnUrl: url } : undefined,
                undefined
            );
            break;
        }
        case ButtonFunctionType.LOGOUT:
            accountService.logout();
            break;
    }
}

//#region Export elements for testing
/* eslint-disable @typescript-eslint/naming-convention */
export const MenuElements = {
    menuElements,
    userElements,
    teacherElements
};
export const ButtonElements = {
    loginButtons,
    accountButtons
};
/* eslint-enable @typescript-eslint/naming-convention */
//#endregion
