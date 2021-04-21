import { Component, OnInit } from '@angular/core';
import { getErrorCode, Tuple } from 'src/app/helper/utils';
import { TeamService } from '../team.service/team.service';
import { TeamItem } from '../team.service/types';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
})
export class TeamsComponent implements OnInit {
  teams: TeamItem[] = [];

  errorCode: number | null = null;
  isLoading = true;
  constructor(private teamService: TeamService) {}

  ngOnInit() {
    this.teamService
      .getTeams()
      .then((teams) => (this.teams = teams))
      .catch((error) => (this.errorCode = getErrorCode(error)))
      .finally(() => (this.isLoading = false));
  }

  getTeamList(): Tuple<string, string, string>[] {
    return this.teams.map(
      (val) => new Tuple(val.name, val.id.toString(), 'fa-users')
    );
  }
}
