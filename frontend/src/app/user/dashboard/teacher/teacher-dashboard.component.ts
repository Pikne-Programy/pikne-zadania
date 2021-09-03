import { Component, Input, OnInit } from '@angular/core';
import { Account } from 'src/app/account/account.service';
import { TeamItem } from '../../team.service/types';
import * as Utils from '../dashboard.utils';

@Component({
    selector: 'app-teacher-dashboard',
    templateUrl: './teacher-dashboard.component.html',
    styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent
implements Utils.DashboardComponentType, OnInit {
  readonly ErrorMessage = Utils.ERROR_MESSAGE;

  @Input() account!: Account;
  @Input() data!: Utils.TeacherData | number;

  teams: TeamItem[] = [];

  errorCode: number | null = null;
  constructor() {}

  ngOnInit() {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this.data === undefined) this.data = Utils.INTERNAL_ERROR;

      if (typeof this.data === 'number') this.errorCode = this.data;
      else
          this.teams = this.data.teams;

  }

  getTeamNames(): [string, string, string][] {
      return this.teams.map((team) => [
          team.name,
          team.teamId.toString(),
          'fa-users'
      ]);
  }
}
