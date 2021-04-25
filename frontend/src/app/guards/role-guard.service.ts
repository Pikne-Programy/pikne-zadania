import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Params,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { Account, AccountService, isAccount } from '../account/account.service';

export enum Role {
  USER,
  TEACHER,
  ADMIN,
}

@Injectable({
  providedIn: 'root',
})
export class RoleGuardService implements CanActivate {
  constructor(private accountService: AccountService, private router: Router) {}

  getAccount(): Account | null {
    return this.accountService.currentAccount.getValue();
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    const account = this.getAccount();
    if (!account || !isAccount(account)) {
      this.redirect('/login', { returnUrl: state.url });
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
  }

  private redirect(destination: string, queryParams?: Params | null) {
    this.router.navigate([destination], { queryParams: queryParams });
  }

  static getRole(account: Account): Role {
    switch (account.team) {
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
