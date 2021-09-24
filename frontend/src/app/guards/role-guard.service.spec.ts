/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
    Account,
    AccountReturnType,
    AccountService
} from '../account/account.service';
import { AuthGuardService } from './auth-guard.service';
import { Role, RoleGuardService } from './role-guard.service';

enum RoleTeam {
    ADMIN,
    TEACHER,
    USER,
    AUTH_GUARD_ERROR
}

describe('Service: RoleGuard', () => {
    const authGuardMock = {
        canActivate: () => Promise.resolve(true)
    };
    const routerMock = {
        navigate: () => {}
    };
    const accountServiceMock = {
        getAccount: () => new Promise<AccountReturnType>(() => {}),
        currentAccount: {
            getValue: (): Account | null => null
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RoleGuardService,
                { provide: AuthGuardService, useValue: authGuardMock },
                { provide: Router, useValue: routerMock },
                { provide: AccountService, useValue: accountServiceMock }
            ]
        });
    });

    describe('canActivate', () => {
        const roleList: [Role[], RoleTeam | null | undefined, boolean][] = [
            [[], RoleTeam.AUTH_GUARD_ERROR, false],
            [[], undefined, false],
            [[], null, false],
            [[Role.ADMIN, Role.TEACHER], RoleTeam.USER, false],
            [[Role.ADMIN, Role.TEACHER], RoleTeam.TEACHER, true],
            [[Role.ADMIN, Role.TEACHER], RoleTeam.ADMIN, true],
            [[Role.ADMIN], RoleTeam.ADMIN, true],
            [[Role.ADMIN], RoleTeam.USER, false],
            [[Role.USER], RoleTeam.USER, true],
            [[Role.USER], RoleTeam.TEACHER, false]
        ];
        for (const [expected, current, contains] of roleList) {
            it(
                `should correctly check role ([${expected
                    .map((role) => Role[role])
                    .join(', ')}], ${getRoleName(current)})`,
                waitForAsync(
                    inject(
                        [
                            RoleGuardService,
                            AuthGuardService,
                            AccountService,
                            Router
                        ],
                        (
                            service: RoleGuardService,
                            authGuard: AuthGuardService,
                            accountService: AccountService,
                            router: Router
                        ) => {
                            expect(service).toBeTruthy();
                            const authGuardSpy = spyOn(
                                authGuard,
                                'canActivate'
                            );
                            const accountSpy = spyOn(
                                accountService.currentAccount,
                                'getValue'
                            );
                            const routerSpy = spyOn(
                                router,
                                'navigate'
                            ).and.stub();
                            const currentUrl = 'register';
                            authGuardSpy.and.callFake(() =>
                                current === RoleTeam.AUTH_GUARD_ERROR
                                    ? Promise.reject('Authorization error')
                                    : Promise.resolve(current !== undefined)
                            );
                            accountSpy.and.callFake(() => getAccount(current));

                            service
                                .canActivate(
                                    {
                                        data: { roles: expected }
                                    } as unknown as ActivatedRouteSnapshot,
                                    { url: currentUrl } as RouterStateSnapshot
                                )
                                .then((result) => {
                                    expect(result)
                                        .withContext(
                                            `Expected ${
                                                contains ? 'not ' : ''
                                            }to let activate ([${expected
                                                .map((role) => Role[role])
                                                .join(', ')}], ${getRoleName(
                                                current
                                            )})`
                                        )
                                        .toBe(contains);
                                })
                                .then(() => {
                                    if (!contains && current !== undefined) {
                                        if (
                                            current === null ||
                                            current ===
                                                RoleTeam.AUTH_GUARD_ERROR
                                        ) {
                                            expect(routerSpy)
                                                .withContext(
                                                    'should redirect (wrong account)'
                                                )
                                                .toHaveBeenCalledWith(
                                                    ['/login'],
                                                    {
                                                        queryParams: {
                                                            returnUrl:
                                                                currentUrl
                                                        }
                                                    }
                                                );
                                        }
                                        else {
                                            expect(routerSpy)
                                                .withContext(
                                                    'should redirect (permission denied)'
                                                )
                                                .toHaveBeenCalledWith(
                                                    ['/user/dashboard'],
                                                    {
                                                        queryParams: undefined
                                                    }
                                                );
                                        }
                                    }
                                })
                                .catch(() => fail('should resolve'));
                        }
                    )
                )
            );
        }
    });

    describe('getPermission', () => {
        const list: [AccountReturnType, Role | null][] = [
            [getAccountReturnObject(null, null), null],
            [getAccountReturnObject({} as Account, 500), null],
            [
                getAccountReturnObject(getAccount(RoleTeam.ADMIN), null),
                Role.ADMIN
            ]
        ];
        for (const [obj, result] of list) {
            it(
                `should return role (${
                    result !== null ? Role[result] : 'null'
                })`,
                waitForAsync(
                    inject(
                        [
                            RoleGuardService,
                            AuthGuardService,
                            AccountService,
                            Router
                        ],
                        async (accountService: AccountService) => {
                            const accountSpy = spyOn(
                                accountService,
                                'getAccount'
                            );
                            accountSpy.and.callFake(async () => obj);
                            if (result !== null) {
                                await expectAsync(
                                    RoleGuardService.getPermissions(
                                        accountService
                                    )
                                ).toBeResolvedTo(result);
                            }
                            else {
                                await expectAsync(
                                    RoleGuardService.getPermissions(
                                        accountService
                                    )
                                ).toBeRejectedWith(
                                    obj.error !== null
                                        ? { status: obj.error }
                                        : {}
                                );
                            }
                        }
                    )
                )
            );
        }
    });

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

function getRoleName(role: RoleTeam | null | undefined): string {
    switch (role) {
        case null:
            return '__not-authorized-null__';
        case undefined:
            return '__not-authorized-authguard__';
        case RoleTeam.AUTH_GUARD_ERROR:
            return '__authorization-error__';
        default:
            return RoleTeam[role];
    }
}

function getRole(teamId: number): Role {
    return RoleGuardService.getRole({ teamId } as Account);
}

function getAccount(roleTeam: RoleTeam | null | undefined): Account | null {
    return roleTeam !== null && roleTeam !== undefined
        ? { name: 'test', number: null, teamId: roleTeam as number }
        : null;
}

function getAccountReturnObject(
    account: Account | null,
    error: number | null
): AccountReturnType {
    return {
        observable: {
            getValue: () => account
        } as BehaviorSubject<Account | null>,
        error
    };
}
