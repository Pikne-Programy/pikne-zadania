/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  Account,
  AccountReturnType,
  AccountService,
} from '../account/account.service';
import { Role, RoleGuardService } from './role-guard.service';

enum RoleTeam {
  ADMIN,
  TEACHER,
  USER,
}

describe('Service: RoleGuard', () => {
  let router = {
    navigate: jasmine.createSpy('navigate'),
  };
  let accountService = {
    getAccount: () => new Promise<AccountReturnType>(() => {}),
    currentAccount: {
      getValue: (): Account | null => null,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoleGuardService,
        { provide: Router, useValue: router },
        { provide: AccountService, useValue: accountService },
      ],
    });
  });

  it('#canActivate should correctly check role', inject(
    [RoleGuardService, Router, AccountService],
    (service: RoleGuardService) => {
      expect(service).toBeTruthy();
      let accountSpy = spyOn(accountService.currentAccount, 'getValue');

      const roleList: [Role[], RoleTeam | null, boolean][] = [
        [[], null, false],
        [[Role.ADMIN, Role.TEACHER], RoleTeam.USER, false],
        [[Role.ADMIN, Role.TEACHER], RoleTeam.TEACHER, true],
        [[Role.ADMIN, Role.TEACHER], RoleTeam.ADMIN, true],
        [[Role.ADMIN], RoleTeam.ADMIN, true],
        [[Role.ADMIN], RoleTeam.USER, false],
        [[Role.USER], RoleTeam.USER, true],
        [[Role.USER], RoleTeam.TEACHER, false],
      ];
      for (const [expected, current, contains] of roleList) {
        const currentUrl = 'register';
        accountSpy.and.callFake(() => getAccount(current));

        const result = service.canActivate(
          { data: { roles: expected } } as unknown as ActivatedRouteSnapshot,
          { url: currentUrl } as RouterStateSnapshot
        );
        if (!contains) {
          if (current === null) {
            expect(router.navigate)
              .withContext('should redirect (wrong account)')
              .toHaveBeenCalledWith(['/login'], {
                queryParams: { returnUrl: currentUrl },
              });
          } else {
            expect(router.navigate)
              .withContext('should redirect (permission denied)')
              .toHaveBeenCalledWith(['/user/dashboard'], {
                queryParams: undefined,
              });
          }
        }
        expect(result).toBe(contains);
      }
    }
  ));

  it(
    '#getPermission should return role',
    waitForAsync(
      inject([AccountService], async (accountService: AccountService) => {
        const list: [AccountReturnType, Role | null][] = [
          [getAccountReturnObject(null, null), null],
          [getAccountReturnObject({} as Account, 500), null],
          [
            getAccountReturnObject(getAccount(RoleTeam.ADMIN), null),
            Role.ADMIN,
          ],
        ];
        let accountSpy = spyOn(accountService, 'getAccount');
        for (const [obj, result] of list) {
          accountSpy.and.callFake(async () => obj);
          if (result !== null) {
            await expectAsync(
              RoleGuardService.getPermissions(accountService)
            ).toBeResolvedTo(result);
          } else {
            await expectAsync(
              RoleGuardService.getPermissions(accountService)
            ).toBeRejectedWith(obj.error !== null ? { status: obj.error } : {});
          }
        }
      })
    )
  );

  it('#getRole should return correct Role', () => {
    expect(getRole(0)).toBe(Role.ADMIN);
    expect(getRole(1)).toBe(Role.TEACHER);
    for (let i = 2; i <= 5; i++) expect(getRole(i)).toBe(Role.USER);
  });

  it('#canEditAssignee should return correct permissions', () => {
    for (let i = 0; i <= 5; i++)
      expect(RoleGuardService.canEditAssignee(i)).toBe(i >= 2);
  });
});

function getRole(team: number): Role {
  return RoleGuardService.getRole({ team: team } as Account);
}

function getAccount(roleTeam: RoleTeam | null): Account | null {
  return roleTeam !== null
    ? { name: 'test', number: null, team: roleTeam as number }
    : null;
}

function getAccountReturnObject(
  account: Account | null,
  error: number | null
): AccountReturnType {
  return {
    observable: {
      getValue: () => account,
    } as BehaviorSubject<Account | null>,
    error: error,
  };
}
