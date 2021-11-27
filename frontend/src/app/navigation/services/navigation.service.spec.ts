/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { QueryParamsHandling, Route, Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import {
    AccountReturnType,
    AccountService
} from 'src/app/account/account.service';
import { Role, RoleGuardService } from 'src/app/guards/role-guard.service';
import { ScreenSizes, SIZES } from 'src/app/helper/screen-size.service';
import {
    setAsyncTimeout,
    TestComponent
} from 'src/app/helper/tests/tests.utils';
import {
    ButtonElement,
    ButtonElements,
    ButtonFunctionType,
    executeButtonClick,
    MenuElement,
    MenuElements,
    NavService
} from './navigation.service';

describe('Service: Navigation', () => {
    describe('MenuElement', () => {
        const text = 'Test';
        const link = '/route1';
        const secondaryLink = '/route2';
        type QueryParams = 'relative';
        const queryParams: QueryParams[] = ['relative'];

        describe('getLink', () => {
            it('should return correct link', () => {
                expect(new MenuElement(text, link).link)
                    .withContext('Only main link')
                    .toBe(link);

                expect(new MenuElement(text, link, secondaryLink).link)
                    .withContext('Has secondary link')
                    .toBe(link + secondaryLink);
            });
        });

        describe('getQueryParams', () => {
            const returnUrl = '/route2';

            it('should return param object (returnUrl)', () => {
                const element = new MenuElement(
                    text,
                    link,
                    undefined,
                    queryParams
                );
                expect(element.getQueryParams(returnUrl)).toEqual({
                    returnUrl
                });
            });

            it('should return undefined (no query params)', () => {
                const list: [string, MenuElement][] = [
                    ['no query params', new MenuElement(text, link)],
                    [
                        'empty query params',
                        new MenuElement(link, text, undefined, [])
                    ]
                ];
                for (const [context, element] of list) {
                    expect(element.getQueryParams(returnUrl))
                        .withContext(context)
                        .toBeUndefined();
                }
            });

            it('should return undefined (no return url)', () => {
                const element = new MenuElement(
                    text,
                    link,
                    undefined,
                    queryParams
                );
                expect(element.getQueryParams()).toBeUndefined();
            });
        });

        describe('getQueryParamsHandling', () => {
            const handling = 'merge';

            it('should return handling', () => {
                const element = new MenuElement(
                    text,
                    link,
                    undefined,
                    queryParams
                );
                expect(element.queryParamsHandling).toBe(handling);
            });

            it('should return undefined', () => {
                const element = new MenuElement(text, link);
                expect(element.queryParamsHandling).toBeUndefined();
            });
        });

        describe('setSelection', () => {
            it('should set selection accordingly', () => {
                const elementList: [MenuElement, boolean][] = [
                    [new MenuElement(text, link), false],
                    [new MenuElement(text, link, secondaryLink), true]
                ];
                for (const [element, hasSecondaryLink] of elementList) {
                    const list: [string, string, boolean][] = [
                        ['Exact match', link, true],
                        ['Deeper route', link + secondaryLink, true],
                        ['Unknown route', '/undefined', false]
                    ];
                    for (const [context, url, result] of list) {
                        element.setSelection(url);
                        expect(element.isSelected)
                            .withContext(context + (hasSecondaryLink ? ' (w/ secondaryLink)' : ''))
                            .toBe(result);
                    }
                }
            });
        });
    });

    describe('ButtonElement', () => {
        const text = 'Test';
        const classes = 'is-primary';
        const path = '/route1';

        describe('onDefaultClick', () => {
            //#region Mocks & spies
            let router: Router;
            let routerSpy: jasmine.Spy;

            const click = ButtonFunctionType.DEFAULT;
            const element = new ButtonElement(text, classes, click, path);
            const queryParams = { returnUrl: '/route2' };
            const paramsHandling = 'merge';
            const paramsHandlingList: (
                | QueryParamsHandling
                | null
                | undefined
            )[] = [null, undefined, paramsHandling];
            //#endregion

            beforeEach(() => {
                TestBed.configureTestingModule({
                    imports: [RouterTestingModule]
                });
                router = TestBed.inject(Router);
                router.initialNavigation();
                routerSpy = spyOn(router, 'navigate');
            });

            it('should navigate w/ queryParams', () => {
                for (const queryParamsHandling of paramsHandlingList) {
                    element.onDefaultClick(
                        router,
                        queryParams,
                        queryParamsHandling
                    );
                    expect(routerSpy)
                        .withContext(
                            `queryParamsHandling: ${queryParamsHandling}`
                        )
                        .toHaveBeenCalledWith([path], {
                            queryParams,
                            queryParamsHandling
                        });
                }
            });

            it('should navigate w/o queryParams', () => {
                for (const queryParamsHandling of paramsHandlingList) {
                    element.onDefaultClick(
                        router,
                        queryParams,
                        queryParamsHandling
                    );
                    expect(routerSpy)
                        .withContext(
                            `queryParamsHandling: ${queryParamsHandling}`
                        )
                        .toHaveBeenCalledWith([path], {
                            queryParams,
                            queryParamsHandling
                        });
                }
            });

            it('should not navigate', () => {
                const noPathElement = new ButtonElement(text, classes, click);
                noPathElement.onDefaultClick(
                    router,
                    queryParams,
                    paramsHandling
                );
                expect(routerSpy).not.toHaveBeenCalled();
            });
        });

        describe('executeButtonClick', () => {
            //#region Mock objects
            let router: Router;
            const defaultRoute = '/public-exercises';
            const routeList = [defaultRoute, '/route1'];
            const routes: Routes = [];
            for (const route of routeList) {
                routes.push({
                    path: route.substring(1),
                    component: TestComponent
                });
            }
            let buttonElement: ButtonElement;
            //#endregion

            beforeEach(() => {
                TestBed.configureTestingModule({
                    imports: [RouterTestingModule.withRoutes(routes)]
                });
                router = TestBed.inject(Router);
                router.initialNavigation();
                router.navigateByUrl(defaultRoute);
                buttonElement = new ButtonElement(
                    'Test',
                    '',
                    ButtonFunctionType.DEFAULT
                );
            });

            const clickFunctions = Object.values(ButtonFunctionType)
                .map((_, i) => i as ButtonFunctionType)
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                .filter((val) => ButtonFunctionType[val] !== undefined);
            for (const clickFunc of clickFunctions) {
                it(`should execute proper function (${ButtonFunctionType[clickFunc]})`, async () => {
                    buttonElement.click = clickFunc;
                    const accountService = {
                        logout: () => {}
                    } as AccountService;

                    switch (clickFunc) {
                        case ButtonFunctionType.DEFAULT: {
                            const clickSpy = spyOn(
                                buttonElement,
                                'onDefaultClick'
                            ).and.stub();

                            for (const route of routeList) {
                                await router.navigateByUrl(route);
                                executeButtonClick(
                                    buttonElement,
                                    router,
                                    accountService
                                );
                                expect(clickSpy)
                                    .withContext(route)
                                    .toHaveBeenCalledWith(
                                        router,
                                        route !== defaultRoute
                                            ? { returnUrl: route }
                                            : undefined,
                                        undefined
                                    );
                            }
                            break;
                        }
                        case ButtonFunctionType.LOGOUT: {
                            const accountServiceSpy = spyOn(
                                accountService,
                                'logout'
                            );

                            executeButtonClick(
                                buttonElement,
                                router,
                                accountService
                            );
                            expect(accountServiceSpy).toHaveBeenCalledWith();
                            break;
                        }
                    }
                });
            }
        });
    });

    describe('Service', () => {
        //#region Mock objects
        const accountServiceMock = {
            getAccount: () => Promise.resolve({}),
            logout: () => {}
        };
        let accountServiceSpy: jasmine.Spy;
        let account$: AccountReturnType | undefined;
        const routeList = ['/public-exercises', '/subject', '/user', '/teams'];
        const routes: Route[] = [];
        for (const route of routeList) {
            routes.push({
                path: route.substring(1),
                component: TestComponent
            });
        }
        const undefinedRoute = '/undefined';
        routes.push({
            path: undefinedRoute.substring(1),
            component: TestComponent
        });
        //#endregion

        beforeEach(async () => {
            TestBed.configureTestingModule({
                imports: [RouterTestingModule.withRoutes(routes)],
                providers: [
                    NavService,
                    { provide: AccountService, useValue: accountServiceMock }
                ]
            });
            const router = TestBed.inject(Router);
            router.initialNavigation();
            await router.navigateByUrl(routeList[0]);

            account$ = {
                observable: new BehaviorSubject(null)
            } as any;
            accountServiceSpy = spyOn(
                accountServiceMock,
                'getAccount'
            ).and.returnValue(Promise.resolve(account$!));
        });

        afterEach(() => {
            account$?.observable.complete();
            account$ = undefined;
        });

        describe('Menu & Button elements', () => {
            it('should display default elements on start', inject(
                [NavService, AccountService, Router],
                (service: NavService) => {
                    expect(service).toBeTruthy();

                    expect(service.menuElements.getValue()).toEqual(
                        MenuElements.menuElements
                    );
                    expect(service.buttonElements.getValue()).toEqual(
                        ButtonElements.loginButtons
                    );
                }
            ));

            it('should display user-specific elements', inject(
                [NavService, AccountService, Router],
                async (service: NavService) => {
                    expect(service).toBeTruthy();
                    spyOn(RoleGuardService, 'getRole').and.returnValue(
                        Role.USER
                    );
                    if (!account$) fail('mock error');
                    else {
                        account$.observable.next({} as any);
                        await setAsyncTimeout(20);

                        expect(service.menuElements.getValue()).toEqual(
                            MenuElements.userElements
                        );
                        expect(service.buttonElements.getValue()).toEqual(
                            ButtonElements.accountButtons
                        );
                    }
                }
            ));

            const list: [string, Role][] = [
                ['Teacher', Role.TEACHER],
                ['Admin', Role.ADMIN]
            ];
            for (const [roleName, role] of list) {
                it(`should display teacher-specific elements (${roleName})`, inject(
                    [NavService, AccountService, Router],
                    async (service: NavService) => {
                        expect(service).toBeTruthy();
                        spyOn(RoleGuardService, 'getRole').and.returnValue(
                            role
                        );
                        if (!account$) fail('mock error');
                        else {
                            account$.observable.next({} as any);
                            await setAsyncTimeout(20);

                            expect(service.menuElements.getValue()).toEqual(
                                MenuElements.teacherElements
                            );
                            expect(service.buttonElements.getValue()).toEqual(
                                ButtonElements.accountButtons
                            );
                        }
                    }
                ));
            }

            it('should display default elements after logout', inject(
                [NavService, AccountService, Router],
                async (service: NavService) => {
                    expect(service).toBeTruthy();
                    spyOn(RoleGuardService, 'getRole').and.returnValue(
                        Role.USER
                    );
                    if (!account$) fail('mock error');
                    else {
                        account$.observable.next({} as any);
                        await setAsyncTimeout(20);
                        //FIXME Change to not.toEqual (userElements should have different elements than default)
                        expect(service.menuElements.getValue()).toEqual(
                            MenuElements.userElements
                        );
                        expect(service.buttonElements.getValue()).toEqual(
                            ButtonElements.accountButtons
                        );

                        account$.observable.next(null);
                        await setAsyncTimeout(20);
                        expect(service.menuElements.getValue()).toEqual(
                            MenuElements.menuElements
                        );
                        expect(service.buttonElements.getValue()).toEqual(
                            ButtonElements.loginButtons
                        );
                    }
                }
            ));
        });

        describe('Menu element selection', () => {
            beforeEach(() => {
                account$ = {
                    observable: new BehaviorSubject({})
                } as any;
                accountServiceSpy.and.returnValue(Promise.resolve(account$!));
                spyOn(RoleGuardService, 'getRole').and.returnValue(
                    Role.TEACHER
                );
            });

            afterEach(() => {
                account$?.observable.complete();
            });

            it('should have default element selected on start', inject(
                [NavService, AccountService, Router],
                async (service: NavService) => {
                    expect(service).toBeTruthy();
                    await setAsyncTimeout(20);

                    const selected = service.menuElements
                        .getValue()
                        .map((val) => val.isSelected);
                    expect(selected).toEqual([true, false, false, false]);
                }
            ));

            it('should change selected element on navigation', inject(
                [NavService, AccountService, Router],
                async (
                    service: NavService,
                    _: AccountService,
                    router: Router
                ) => {
                    expect(service).toBeTruthy();
                    await setAsyncTimeout(20);

                    let selected = service.menuElements
                        .getValue()
                        .map((val) => val.isSelected);
                    expect(selected)
                        .withContext('Initial state')
                        .toEqual([true, false, false, false]);

                    await router.navigateByUrl(routeList[1]);
                    selected = service.menuElements
                        .getValue()
                        .map((val) => val.isSelected);
                    expect(selected)
                        .withContext('After navigation')
                        .toEqual([false, true, false, false]);
                }
            ));

            it('should have no selected elements', inject(
                [NavService, AccountService, Router],
                async (
                    service: NavService,
                    _: AccountService,
                    router: Router
                ) => {
                    expect(service).toBeTruthy();
                    await setAsyncTimeout(20);

                    await router.navigateByUrl(undefinedRoute);
                    const selected = service.menuElements
                        .getValue()
                        .map((val) => val.isSelected);
                    expect(selected)
                        .withContext('After navigation')
                        .toEqual([false, false, false, false]);
                }
            ));

            it('should change selected element on user change', inject(
                [NavService, AccountService, Router],
                async (service: NavService) => {
                    expect(service).toBeTruthy();
                    await setAsyncTimeout(20);

                    let selected = service.menuElements
                        .getValue()
                        .map((val) => val.isSelected);
                    expect(selected)
                        .withContext('Initial state')
                        .toEqual([true, false, false, false]);

                    account$!.observable.next(null);
                    await setAsyncTimeout(20);
                    selected = service.menuElements
                        .getValue()
                        .map((val) => val.isSelected);
                    expect(selected)
                        .withContext('After user change')
                        .toEqual([true, false]);
                }
            ));
        });

        describe('toggleSidenav', () => {
            let windowSpy: jasmine.Spy;
            const toggleWidth = SIZES[ScreenSizes.TABLET][1] + 1;

            beforeEach(() => {
                windowSpy = spyOnProperty(window, 'innerWidth');
            });

            it('should open navigation drawer', inject(
                [NavService, AccountService, Router],
                (service: NavService) => {
                    expect(service).toBeTruthy();
                    expect(service.sideNavOpened.getValue())
                        .withContext('Initial value')
                        .toBeFalse();

                    service.toggleSidenav();
                    expect(service.sideNavOpened.getValue()).toBeTrue();
                }
            ));

            it('should close navigation drawer', inject(
                [NavService, AccountService, Router],
                (service: NavService) => {
                    expect(service).toBeTruthy();
                    service.sideNavOpened.next(true);
                    expect(service.sideNavOpened.getValue())
                        .withContext('Initial value')
                        .toBeTrue();

                    service.toggleSidenav();
                    expect(service.sideNavOpened.getValue()).toBeFalse();
                }
            ));

            it('should close navigation drawer on resize', inject(
                [NavService, AccountService, Router],
                (service: NavService) => {
                    expect(service).toBeTruthy();
                    service.sideNavOpened.next(true);
                    expect(service.sideNavOpened.getValue())
                        .withContext('Initial value')
                        .toBeTrue();

                    windowSpy.and.returnValue(toggleWidth + 1);
                    window.dispatchEvent(new Event('resize'));
                    expect(service.sideNavOpened.getValue()).toBeFalse();
                }
            ));

            it('should not close navigation drawer on resize', inject(
                [NavService, AccountService, Router],
                (service: NavService) => {
                    expect(service).toBeTruthy();
                    service.sideNavOpened.next(true);
                    expect(service.sideNavOpened.getValue())
                        .withContext('Initial value')
                        .toBeTrue();

                    windowSpy.and.returnValue(toggleWidth);
                    window.dispatchEvent(new Event('resize'));
                    expect(service.sideNavOpened.getValue()).toBeTrue();
                }
            ));

            it('should not open navigation drawer on resize', inject(
                [NavService, AccountService, Router],
                (service: NavService) => {
                    expect(service).toBeTruthy();
                    expect(service.sideNavOpened.getValue())
                        .withContext('Initial value')
                        .toBeFalse();

                    windowSpy.and.returnValue(toggleWidth);
                    window.dispatchEvent(new Event('resize'));
                    expect(service.sideNavOpened.getValue())
                        .withContext('Mobile size')
                        .toBeFalse();

                    windowSpy.and.returnValue(toggleWidth + 1);
                    window.dispatchEvent(new Event('resize'));
                    expect(service.sideNavOpened.getValue())
                        .withContext('Desktop size')
                        .toBeFalse();
                }
            ));
        });
    });
});
