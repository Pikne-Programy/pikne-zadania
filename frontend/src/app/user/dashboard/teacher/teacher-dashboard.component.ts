import { Component, Input, OnInit } from '@angular/core';
import { Account } from 'src/app/account/account.service';
import { TeamItem } from '../../team.service/types';
import * as Utils from '../dashboard.utils';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss'],
})
export class TeacherDashboardComponent
  implements Utils.DashboardComponentType, OnInit
{
  readonly ErrorMessage = Utils.ErrorMessage;

  @Input() account!: Account;
  @Input() data!: Utils.TeacherData | number;

  teams: TeamItem[] = [];

  errorCode: number | null = null;
  constructor() {}

  ngOnInit() {
    if (this.data === undefined) this.data = Utils.InternalError;

    if (typeof this.data === 'number') this.errorCode = this.data;
    else {
      this.teams = this.data.teams;
    }
  }

  getTeamNames(): [string, string, string][] {
    return this.teams.map((team) => [
      team.name,
      team.id.toString(),
      'fa-users',
    ]);
  }
}
