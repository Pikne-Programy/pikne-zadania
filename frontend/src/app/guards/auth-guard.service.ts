import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from '../account/account.service';

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
        const account = response.observable.getValue();
        if (response.error === null && account !== null) return true;
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
}
