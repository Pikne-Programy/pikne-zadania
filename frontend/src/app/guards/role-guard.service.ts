import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Params,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import { Account, AccountService, isAccount } from '../account/account.service';
import { AuthGuardService } from './auth-guard.service';

export enum Role {
    USER,
    TEACHER,
    ADMIN
}

export const TEACHER_ROLES = [Role.TEACHER, Role.ADMIN];

@Injectable({
    providedIn: 'root'
})
export class RoleGuardService implements CanActivate {
    constructor(
        private authGuard: AuthGuardService,
        private accountService: AccountService,
        private router: Router
    ) {}

    getAccount(): Account | null {
        return this.accountService.currentAccount.getValue();
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> {
        return this.authGuard
            .canActivate(route, state)
            .then((result) => {
                if (!result) return false;

                const account = this.getAccount();
                if (!account || !isAccount(account)) {
                    this.redirectToLogin(state);
                    return false;
                }
                const roles = route.data.roles;
                if (
                    !roles ||
                    !Array.isArray(roles) ||
                    roles.some((role) => typeof role !== 'number') ||
                    !roles.includes(RoleGuardService.getRole(account))
                ) {
                    this.redirect('/user/dashboard');
                    return false;
                }
                return true;
            })
            .catch(() => {
                this.redirectToLogin(state);
                return false;
            });
    }

    private redirectToLogin(state: RouterStateSnapshot) {
        this.redirect('/login', { returnUrl: state.url });
    }

    private redirect(destination: string, queryParams?: Params | null) {
        this.router.navigate([destination], { queryParams });
    }

    static getRole(account: Account): Role {
        switch (account.teamId) {
            case 0:
                return Role.ADMIN;
            case 1:
                return Role.TEACHER;
            default:
                return Role.USER;
        }
    }

    static async getPermissions(accountService: AccountService): Promise<Role> {
        return accountService
            .getAccount()
            .then((val) => {
                if (val.error !== null) throw { status: val.error };
                return val.observable.getValue();
            })
            .then((account) => {
                if (!account) throw {};
                return RoleGuardService.getRole(account);
            });
    }

    static canEditAssignee(teamId: number): boolean {
        return teamId >= 2;
    }
}
