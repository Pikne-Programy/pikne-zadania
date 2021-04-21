import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getErrorCode, pbkdf2 } from 'src/app/helper/utils';
import { InternalError } from '../../dashboard/dashboard.utils';
import { TeamService } from '../../team.service/team.service';
import { Team } from '../../team.service/types';

@Component({
  selector: 'app-team-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
})
export class TeamItemComponent implements OnInit {
  private readonly IdError = 400;
  readonly InternalError = InternalError;

  team?: Team;

  isLoading = true;
  errorCode: number | null = null;
  constructor(
    private teamService: TeamService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const teamId = Number(this.route.snapshot.paramMap.get('teamId'));
    if (!isNaN(teamId)) {
      this.teamService
        .getTeam(teamId)
        .then((team) => (this.team = team))
        .catch((error) => (this.errorCode = getErrorCode(error, this.IdError)))
        .finally(() => (this.isLoading = false));
    } else {
      this.errorCode = this.IdError;
      this.isLoading = false;
    }
  }
}
