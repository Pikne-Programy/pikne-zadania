import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Account, AccountService } from 'src/app/account/account.service';
import { Role, RoleGuardService } from 'src/app/guards/role-guard.service';
import { getErrorCode, Tuple } from 'src/app/helper/utils';
import { TeamService } from '../team.service/team.service';
import * as Utils from './dashboard.utils';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly UserRole = Role.USER;
  private readonly AccountError = 401;

  account?: Account;
  teacherData?: Utils.TeacherData | number;
  userData?: Utils.UserData | number;
  /**
   * First - text; Second - link; Third - icon
   */
  shortcuts: Tuple<string, string, string>[] = [];

  isLoading = true;
  errorCode: number | null = null;
  account$?: Subscription;
  constructor(
    private accountService: AccountService,
    private teamService: TeamService
  ) {}

  ngOnInit() {
    this.accountService
      .getAccount()
      .then((val) => {
        this.account$ = val.observable.subscribe((account) => {
          if (account) {
            this.account = account;
            switch (RoleGuardService.getRole(account)) {
              case Role.USER:
                this.shortcuts = Utils.userShortcuts;
                //TODO User dashboard
                this.userData = new Utils.UserData();
                this.isLoading = false;
                break;
              default:
                this.shortcuts = Utils.teacherShortcuts;
                this.teamService
                  .getTeams()
                  .then(
                    (teams) => (this.teacherData = new Utils.TeacherData(teams))
                  )
                  .catch((error) => (this.teacherData = getErrorCode(error)))
                  .finally(() => (this.isLoading = false));
            }
            this.errorCode = null;
          } else {
            this.isLoading = false;
            this.account = undefined;
            this.shortcuts = [];
            this.errorCode = this.AccountError;
          }
        });
      })
      .catch((error) => {
        this.errorCode = getErrorCode(error, this.AccountError);
      });
  }

  ngOnDestroy() {
    this.account$?.unsubscribe();
  }

  getRole(account: Account) {
    return RoleGuardService.getRole(account);
  }

  getErrorCode(): number | null {
    if (this.errorCode !== null) return this.errorCode;
    if (!this.account) return this.AccountError;
    const role = this.getRole(this.account);
    if (
      (role === Role.USER && this.userData === undefined) ||
      (role !== Role.USER && this.teacherData === undefined)
    )
      return Utils.InternalError;
    return null;
  }
}
