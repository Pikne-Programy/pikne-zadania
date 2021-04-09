import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Account, AccountService } from 'src/app/account/account.service';
import { AuthGuardService, Role } from 'src/app/account/auth-guard.service';
import { getErrorCode, Tuple } from 'src/app/helper/utils';

export interface DashboardComponentType {
  /**
   * @Input Angular input
   */
  account?: Account;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly UserRole = Role.USER;
  readonly accountError = 401;

  account?: Account;
  /**
   * First - text; Second - link; Third - icon
   */
  shortcuts: Tuple<string, string, string>[] = [];

  errorCode: number | null = null;
  accountSubscription?: Subscription;
  constructor(private accountService: AccountService) {}

  ngOnInit() {
    this.accountService
      .getAccount()
      .then((val) => {
        this.accountSubscription = val.observable.subscribe((account) => {
          if (account) {
            this.account = account;
            switch (AuthGuardService.getRole(account)) {
              case Role.USER:
                this.shortcuts = userShortcuts;
                break;
              default:
                this.shortcuts = teacherShortcuts;
            }
            this.errorCode = null;
          } else {
            this.account = undefined;
            this.shortcuts = [];
            this.errorCode = this.accountError;
          }
        });
      })
      .catch((error) => {
        this.errorCode = getErrorCode(error, this.accountError);
      });
  }

  ngOnDestroy() {
    this.accountSubscription?.unsubscribe();
  }

  getRole(account: Account) {
    return AuthGuardService.getRole(account);
  }
}

const userShortcuts: Tuple<string, string, string>[] = [
  new Tuple('user', '/public-exercises', 'fa-book'),
];
const teacherShortcuts: Tuple<string, string, string>[] = [
  new Tuple('teacher', '/public-exercises', 'fa-book'),
];
