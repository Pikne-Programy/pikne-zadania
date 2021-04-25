import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { getErrorCode, Tuple } from 'src/app/helper/utils';
import { TeamService } from '../team.service/team.service';
import { TeamItem } from '../team.service/types';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
})
export class TeamsComponent implements OnInit {
  constructor(private teamService: TeamService) {}

  ngOnInit() {
    this.fetchTeams();
  }
  //#region Teams
  teams: TeamItem[] = [];

  errorCode: number | null = null;
  isLoading = true;

  getTeamList(): Tuple<string, string, string>[] {
    return this.teams.map(
      (val) => new Tuple(val.name, val.id.toString(), 'fa-users')
    );
  }

  fetchTeams() {
    this.isLoading = true;
    this.teamService
      .getTeams()
      .then((teams) => (this.teams = teams))
      .catch((error) => (this.errorCode = getErrorCode(error)))
      .finally(() => (this.isLoading = false));
  }
  //#endregion

  //#region New Team Modal
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });
  get name() {
    return this.form.get('name');
  }

  isModalOpen = false;
  modalErrorCode: number | null = null;
  isModalLoading = false;

  addTeam() {
    this.isModalLoading = true;
    this.teamService
      .createTeam(this.name!.value)
      .then(() => {
        this.closeModal();
        this.fetchTeams();
      })
      .catch((error) => (this.modalErrorCode = getErrorCode(error)))
      .finally(() => (this.isModalLoading = false));
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.form.reset();
    this.isModalOpen = false;
    this.modalErrorCode = null;
  }
  //#endregion
}
