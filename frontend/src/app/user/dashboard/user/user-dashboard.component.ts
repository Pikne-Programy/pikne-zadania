import { Component, Input, OnInit } from '@angular/core';
import { Account } from 'src/app/account/account.service';
import * as Utils from '../dashboard.utils';

@Component({
    selector: 'app-user-dashboard',
    templateUrl: './user-dashboard.component.html',
    styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent
implements Utils.DashboardComponentType, OnInit {
    readonly ErrorMessage = Utils.ERROR_MESSAGE;

  @Input() account!: Account;
  @Input() data!: Utils.UserData | number;

  errorCode: number | null = null;
  constructor() {}

  ngOnInit() {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this.data === undefined) this.data = Utils.INTERNAL_ERROR;

      if (typeof this.data === 'number') this.errorCode = this.data;
      else {
      //TODO Using UserData
      }
  }
}
