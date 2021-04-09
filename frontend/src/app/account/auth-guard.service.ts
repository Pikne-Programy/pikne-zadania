import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { Account, AccountService } from './account.service';

export enum Role {
  USER,
  TEACHER,
  ADMIN,
}

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(private accountService: AccountService, private router: Router) {}

  canActivate(
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.accountService
      .getAccount()
      .then((response) => {
        if (response.error === null && response.observable.getValue() !== null)
          return true;
        else {
          this.redirectToLogin(state);
          return false;
        }
      })
      .catch(() => {
        this.redirectToLogin(state);
        return false;
      });
  }

  private redirectToLogin(state: RouterStateSnapshot) {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
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
}
