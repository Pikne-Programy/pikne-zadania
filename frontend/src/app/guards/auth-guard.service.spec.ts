/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AccountReturnType, AccountService } from '../account/account.service';
import { AuthGuardService } from './auth-guard.service';

describe('Service: AuthGuard', () => {
  let accountService = {
    getAccount: () => new Promise<AccountReturnType>(() => {}),
  };
  let router = {
    navigate: jasmine.createSpy('navigate'),
  };
  const returnUrl = 'return/url';
  const routerState = {
    url: returnUrl,
  };
  const navExtras = {
    queryParams: { returnUrl: routerState.url },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuardService,
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it(
    'should let activate',
    waitForAsync(
      inject(
        [AuthGuardService, AccountService, Router],
        async (service: AuthGuardService, accountService: AccountService) => {
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
        async (service: AuthGuardService, accountService: AccountService) => {
          expect(service).toBeTruthy();

          spyOn(accountService, 'getAccount').and.returnValue(
            getAccountPromise({}, 500)
          );

          const result = await service.canActivate(
            {} as ActivatedRouteSnapshot,
            routerState as RouterStateSnapshot
          );
          expect(router.navigate).toHaveBeenCalledWith(['/login'], navExtras);
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
        async (service: AuthGuardService, accountService: AccountService) => {
          expect(service).toBeTruthy();

          spyOn(accountService, 'getAccount').and.returnValue(
            getAccountPromise(null, null)
          );

          const result = await service.canActivate(
            {} as ActivatedRouteSnapshot,
            routerState as RouterStateSnapshot
          );
          expect(router.navigate).toHaveBeenCalledWith(['/login'], navExtras);
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
        async (service: AuthGuardService, accountService: AccountService) => {
          expect(service).toBeTruthy();

          spyOn(accountService, 'getAccount').and.returnValue(
            Promise.reject(getAccountPromise({}, null))
          );

          const result = await service.canActivate(
            {} as ActivatedRouteSnapshot,
            routerState as RouterStateSnapshot
          );
          expect(router.navigate).toHaveBeenCalledWith(['/login'], navExtras);
          expect(result).toBe(false);
        }
      )
    )
  );
});

function getAccountPromise(
  accountValue: {} | null,
  error: number | null
): Promise<AccountReturnType> {
  return new Promise(() => {
    return {
      observable: {
        getValue: () => accountValue,
      },
      error: error,
    };
  });
}
