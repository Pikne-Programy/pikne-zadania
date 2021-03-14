import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import * as ServerRoutes from '../server-routes';
import { AccountService, isAccount } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(private accountService: AccountService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const account = this.accountService.getCurrentAccount();
    if (account !== null && typeof account !== 'number' && isAccount(account))
      return true;
    this.router.navigate([ServerRoutes.login], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }
}
