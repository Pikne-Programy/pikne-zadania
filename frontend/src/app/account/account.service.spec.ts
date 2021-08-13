/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { Account, AccountService } from './account.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ThemeService } from '../helper/theme.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as ServerRoutes from '../server-routes';
import { setAsyncTimeout } from '../helper/tests/tests.utils';
import { TypeError } from '../helper/utils';

describe('Service: Account', () => {
  let httpController: HttpTestingController;

  //#region Mocks and consts
  const messageWrong = 'should return error';
  const email = 'b@b.bb';
  const password = 'b';
  const hashedPassword = 'ZywyW1h4EKLJe/jAjKiDN+eufwV0SOeTIjb2DBMgJqQ=';
  let themeService = {
    resetTheme: () => {},
  };
  let router: {
    navigate: (arg0: any[], arg1: any) => void;
  } = {
    navigate: () => {},
  };
  let route = 'Test Route';
  const logoutNavParams = {
    relativeTo: route,
    queryParamsHandling: 'preserve',
  };
  //#endregion

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AccountService,
        HttpClient,
        { provide: ThemeService, useValue: themeService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Creating Account', () => {
    const messageCorrect = 'should send correct Account info';
    const stdObj = {
      login: email,
      name: 'UserB',
      hashedPassword,
      number: 12,
      invitation: 'QwErTy',
    };
    const adminPass = 'secret';
    const adminObj = {
      login: 'admin',
      name: 'Admin',
      hashedPassword: 'u/+1fh/AmmWzro+YA7khgk1L5VfYoABocupuT41i+AA=',
      number: null,
      invitation: 'abc123',
    };
    const list: [
      string,
      {
        login: string;
        name: string;
        hashedPassword: string;
        number: number | null;
        invitation: string;
      },
      number | null
    ][] = [
      [password, stdObj, null],
      [adminPass, adminObj, null],
      [password, stdObj, 409],
      [adminPass, adminObj, 403],
    ];

    for (const [password, resultObj, error] of list) {
      it(
        error === null
          ? `${messageCorrect} (${resultObj.name})`
          : `${messageWrong} (${error})`,
        waitForAsync(
          inject(
            [AccountService, HttpClient],
            async (service: AccountService) => {
              expect(service).toBeTruthy();

              const promise = service.createAccount(
                resultObj.login,
                resultObj.name,
                password,
                resultObj.invitation,
                resultObj.number?.toString() ?? null
              );
              await setAsyncTimeout(4000);
              const req = httpController.expectOne(ServerRoutes.register);
              expect(req.request.method).toEqual('POST');
              expect(req.request.body).toEqual(resultObj);
              if (error === null) {
                req.flush({}, { status: 200, statusText: 'Success' });
                await expectAsync(promise).toBeResolved();
              } else {
                req.error(new ErrorEvent('Server error'), {
                  status: error,
                });
                await expectAsync(promise).toBeRejected();
              }
            }
          )
        ),
        6000
      );
    }
  });

  describe('Fetching Account', () => {
    const messageCorrect = 'should fetch correct account';
    const list: [any, number | null][] = [
      [
        {
          name: 'Test',
          number: 1,
          team: 2,
        },
        null,
      ],
      [
        {
          name: 'Teacher',
          number: null,
          team: 1,
        },
        null,
      ],
      [{}, TypeError],
      [
        {
          name: 1,
          number: null,
          team: 'abc',
        },
        TypeError,
      ],
    ];
    for (const [account, error] of list) {
      it(
        error === null
          ? `${messageCorrect} (${account.name})`
          : `${messageWrong} (${error})`,
        waitForAsync(
          inject(
            [AccountService, HttpClient],
            async (service: AccountService) => {
              expect(service).toBeTruthy();

              const promise = service.getAccount();
              const req = httpController.expectOne(ServerRoutes.user);
              expect(req.request.method).toEqual('GET');
              req.flush(account);

              const response = await promise;
              expect(response.error).toBe(error);
              response.observable.subscribe((val) => {
                expect(val).toBe(error !== null ? null : account);
              });
            }
          )
        )
      );
    }

    it(
      'should return error from server',
      waitForAsync(
        inject(
          [AccountService, HttpClient],
          async (service: AccountService) => {
            expect(service).toBeTruthy();
            const ErrorCode = 500;

            const promise = service.getAccount();
            const req = httpController.expectOne(ServerRoutes.user);
            expect(req.request.method).toEqual('GET');
            req.error(new ErrorEvent('Server error'), { status: ErrorCode });

            const response = await promise;
            expect(response.error).toBe(ErrorCode);
            response.observable.subscribe((val) => {
              expect(val).toBe(null);
            });
          }
        )
      )
    );
  });

  describe('Login', () => {
    it(
      'should log in',
      waitForAsync(
        inject(
          [AccountService, HttpClient],
          async (service: AccountService) => {
            expect(service).toBeTruthy();

            const promise = service.login(email, password);
            await setAsyncTimeout(4000).then();
            const req = httpController.expectOne(ServerRoutes.login);
            expect(req.request.method).toEqual('POST');
            expect(req.request.body).toEqual({ login: email, hashedPassword });
            req.flush({});

            await expectAsync(promise).toBeResolved();
          }
        )
      )
    );

    it(
      'should not log in',
      waitForAsync(
        inject(
          [AccountService, HttpClient],
          async (service: AccountService) => {
            expect(service).toBeTruthy();

            const promise = service.login(email, password);
            await setAsyncTimeout(4000);
            const req = httpController.expectOne(ServerRoutes.login);
            expect(req.request.method).toEqual('POST');
            req.error(new ErrorEvent('Wrong password'), { status: 401 });

            await expectAsync(promise).toBeRejected();
          }
        )
      )
    );
  });

  describe('Logout', () => {
    it('should log out', inject(
      [AccountService, HttpClient, ThemeService, Router, ActivatedRoute],
      async (service: AccountService) => {
        expect(service).toBeTruthy();

        const consoleSpy = spyOn(console, 'warn');
        const themeSpy = spyOn(themeService, 'resetTheme');
        const routerSpy = spyOn(router, 'navigate');
        const clearAccountSpy = spyOn(service, 'clearAccount');

        service.logout();
        const req = httpController.expectOne(ServerRoutes.logout);
        expect(req.request.method).toEqual('POST');
        req.flush({});

        await setAsyncTimeout(1000);
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(themeSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['./'], logoutNavParams);
        expect(clearAccountSpy).toHaveBeenCalled();
      }
    ));

    it('should log out (with error)', inject(
      [AccountService, HttpClient, ThemeService, Router, ActivatedRoute],
      async (service: AccountService) => {
        expect(service).toBeTruthy();

        const consoleSpy = spyOn(console, 'warn');
        const themeSpy = spyOn(themeService, 'resetTheme');
        const routerSpy = spyOn(router, 'navigate');
        const clearAccountSpy = spyOn(service, 'clearAccount');

        service.logout();
        const req = httpController.expectOne(ServerRoutes.logout);
        expect(req.request.method).toEqual('POST');
        const ErrorCode = 500;
        req.error(new ErrorEvent('Server error'), { status: ErrorCode });

        await setAsyncTimeout(1000);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Logout error',
          jasmine.objectContaining({ status: ErrorCode })
        );
        expect(themeSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['./'], logoutNavParams);
        expect(clearAccountSpy).toHaveBeenCalled();
      }
    ));
  });

  describe('Clearing Account', () => {
    it('should clear current Account', inject(
      [AccountService],
      (service: AccountService) => {
        expect(service).toBeTruthy();
        service.currentAccount.next({} as Account);
        expect(service.currentAccount.getValue()).not.toBe(null);

        service.clearAccount();
        service.currentAccount.subscribe((val) => {
          expect(val).toBe(null);
        });
      }
    ));
  });
});
