/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AccountReturnType, AccountService } from '../account/account.service';
import { AuthGuardService } from './auth-guard.service';

describe('Service: AuthGuard', () => {
    const accountServiceMock = {
        getAccount: () => new Promise<AccountReturnType>(() => {})
    };
    const returnUrl = 'return/url';
    const routerState = {
        url: returnUrl
    };
    const navExtras = {
        queryParams: { returnUrl: routerState.url }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                AuthGuardService,
                { provide: AccountService, useValue: accountServiceMock }
            ]
        });
        TestBed.inject(Router).initialNavigation();
    });

    it(
        'should let activate',
        waitForAsync(
            inject(
                [AuthGuardService, AccountService, Router],
                async (
                    service: AuthGuardService,
                    accountService: AccountService
                ) => {
                    expect(service).toBeTruthy();

                    spyOn(accountService, 'getAccount').and.returnValue(
                        getAccountPromise({}, null)
                    );

                    const result = await service.canActivate(
                        {} as ActivatedRouteSnapshot,
                        routerState as RouterStateSnapshot
                    );
                    expect(result).toBe(true);
                }
            )
        )
    );

    it(
        'should redirect (account error)',
        waitForAsync(
            inject(
                [AuthGuardService, AccountService, Router],
                async (
                    service: AuthGuardService,
                    accountService: AccountService,
                    router: Router
                ) => {
                    expect(service).toBeTruthy();
                    const routerSpy = spyOn(router, 'navigate');

                    spyOn(accountService, 'getAccount').and.returnValue(
                        getAccountPromise({}, 500)
                    );

                    const result = await service.canActivate(
                        {} as ActivatedRouteSnapshot,
                        routerState as RouterStateSnapshot
                    );
                    expect(routerSpy).toHaveBeenCalledWith(
                        ['/login'],
                        navExtras
                    );
                    expect(result).toBe(false);
                }
            )
        )
    );

    it(
        'should redirect (account is null)',
        waitForAsync(
            inject(
                [AuthGuardService, AccountService, Router],
                async (
                    service: AuthGuardService,
                    accountService: AccountService,
                    router: Router
                ) => {
                    expect(service).toBeTruthy();
                    const routerSpy = spyOn(router, 'navigate');

                    spyOn(accountService, 'getAccount').and.returnValue(
                        getAccountPromise(null, null)
                    );

                    const result = await service.canActivate(
                        {} as ActivatedRouteSnapshot,
                        routerState as RouterStateSnapshot
                    );
                    expect(routerSpy).toHaveBeenCalledWith(
                        ['/login'],
                        navExtras
                    );
                    expect(result).toBe(false);
                }
            )
        )
    );

    it(
        'should redirect (promise rejected)',
        waitForAsync(
            inject(
                [AuthGuardService, AccountService, Router],
                async (
                    service: AuthGuardService,
                    accountService: AccountService,
                    router: Router
                ) => {
                    expect(service).toBeTruthy();
                    const routerSpy = spyOn(router, 'navigate');

                    spyOn(accountService, 'getAccount').and.rejectWith(
                        getAccountPromise({}, null)
                    );

                    const result = await service.canActivate(
                        {} as ActivatedRouteSnapshot,
                        routerState as RouterStateSnapshot
                    );
                    expect(routerSpy).toHaveBeenCalledWith(
                        ['/login'],
                        navExtras
                    );
                    expect(result).toBe(false);
                }
            )
        )
    );
});

function getAccountPromise(
    accountValue: unknown | null,
    error: number | null
): Promise<AccountReturnType> {
    return Promise.resolve({
        observable: {
            getValue: () => accountValue
        } as any,
        error
    });
}
