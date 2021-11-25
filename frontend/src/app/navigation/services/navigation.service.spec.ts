/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { QueryParamsHandling, Router, Routes } from '@angular/router';
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
import { ObjectType } from 'src/app/helper/utils';
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
        const link = '/route1';
        const text = 'Test';
        type QueryParams = 'relative';
        const queryParams: QueryParams[] = ['relative'];

        describe('getQueryParams', () => {
            const returnUrl = '/route2';

            it('should return param object (returnUrl)', () => {
                const element = new MenuElement(link, text, queryParams);
                expect(element.getQueryParams(returnUrl)).toEqual({
                    returnUrl
                });
            });

            it('should return undefined (no query params)', () => {
                const list: [string, MenuElement][] = [
                    ['no query params', new MenuElement(link, text)],
                    ['empty query params', new MenuElement(link, text, [])]
                ];
                for (const [context, element] of list) {
                    expect(element.getQueryParams(returnUrl))
                        .withContext(context)
                        .toBeUndefined();
                }
            });

            it('should return undefined (no return url)', () => {
                const element = new MenuElement(link, text, queryParams);
                expect(element.getQueryParams()).toBeUndefined();
            });
        });

        describe('getQueryParamsHandling', () => {
            const handling = 'merge';

            it('should return handling', () => {
                const element = new MenuElement(link, text, queryParams);
                expect(element.queryParamsHandling).toBe(handling);
            });

            it('should return undefined', () => {
                const element = new MenuElement(link, text);
                expect(element.queryParamsHandling).toBeUndefined();
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
        const accountServiceMock = {
            getAccount: () => Promise.resolve({}),
            logout: () => {}
        };
        let account$: AccountReturnType | undefined;

        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [
                    NavService,
                    { provide: AccountService, useValue: accountServiceMock }
                ]
            });
            account$ = {
                observable: new BehaviorSubject(null)
            } as any;
            spyOn(TestBed.inject(AccountService), 'getAccount').and.returnValue(
                Promise.resolve(account$!)
            );
        });

        afterEach(() => {
            account$?.observable.complete();
            account$ = undefined;
        });

        describe('Menu & Button elements', () => {
            it('should display default elements on start', inject(
                [NavService, AccountService],
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
                [NavService, AccountService],
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
                    [NavService, AccountService],
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
                [NavService, AccountService],
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

        describe('toggleSidenav', () => {
            let windowSpy: jasmine.Spy;
            const toggleWidth = SIZES[ScreenSizes.TABLET][1] + 1;

            beforeEach(() => {
                windowSpy = spyOnProperty(window, 'innerWidth');
            });

            it('should open navigation drawer', inject(
                [NavService, AccountService],
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
                [NavService, AccountService],
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
                [NavService, AccountService],
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
                [NavService, AccountService],
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
                [NavService, AccountService],
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
