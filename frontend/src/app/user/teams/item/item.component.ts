import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from 'src/app/account/account.service';
import { Role, RoleGuardService } from 'src/app/guards/role-guard.service';
import { getErrorCode } from 'src/app/helper/utils';
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
  private readonly AccountError = 420;
  readonly InternalError = InternalError;

  team?: Team;

  isAdmin = false;
  isLoading = true;
  errorCode: number | null = null;
  defaultErrorMessage = true;

  constructor(
    private teamService: TeamService,
    private accountService: AccountService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.fetchTeam();
  }

  private fetchTeam() {
    const teamId = Number(this.route.snapshot.paramMap.get('teamId'));
    if (!isNaN(teamId)) {
      RoleGuardService.getPermissions(this.accountService)
        .then(
          (role) =>
            (this.isAdmin =
              role === Role.ADMIN && RoleGuardService.canEditAssignee(teamId))
        )
        .catch((error) => {
          this.defaultErrorMessage = false;
          throw { status: getErrorCode(error, this.AccountError) };
        })
        .then(() => this.teamService.getTeam(teamId))
        .then((team) => (this.team = team))
        .catch((error) => (this.errorCode = getErrorCode(error, this.IdError)))
        .finally(() => (this.isLoading = false));
    } else {
      this.errorCode = this.IdError;
      this.isLoading = false;
    }
  }
}
