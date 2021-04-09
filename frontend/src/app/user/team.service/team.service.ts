import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as Utils from './types';
import * as ServerRoutes from '../../server-routes';
import { switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly typeError = 400;

  constructor(private http: HttpClient) {}

  //#region Fetching
  getTeams() {
    return this.http
      .get(ServerRoutes.teams)
      .pipe(
        switchMap((response) =>
          response &&
          Array.isArray(response) &&
          response.every((val) => Utils.isTeamItem(val))
            ? (response as Utils.TeamItem[])
            : throwError({ status: this.typeError })
        )
      )
      .toPromise();
  }

  getTeam(id: number) {
    return this.http
      .get(ServerRoutes.team(id))
      .pipe(
        switchMap((response) =>
          response && Utils.isTeam(response)
            ? of(response)
            : throwError({ status: this.typeError })
        )
      )
      .toPromise();
  }
  //#endregion

  //#region Team modification
  createTeam(name: string) {
    return this.http
      .post(ServerRoutes.addTeam, { name: name })
      .pipe(
        switchMap((response) =>
          typeof response === 'number'
            ? of(response)
            : throwError({ status: this.typeError })
        )
      )
      .toPromise();
  }
  setTeamName(id: number, name: string) {
    return this.http.post(ServerRoutes.setTeamName(id), name).toPromise();
  }
  setAssignee(id: number, assignee: string) {
    return this.http
      .post(ServerRoutes.changeTeamAssignee(id), assignee)
      .toPromise();
  }
  //#endregion

  //#region Registration
  openTeam(id: number, code: string | null) {
    if (code !== null) code = code.trim();
    return this.http
      .post(
        ServerRoutes.openTeam(id),
        code !== null && code.length > 0 ? code : null
      )
      .toPromise();
  }
  closeTeam(id: number) {
    return this.http.post(ServerRoutes.closeTeam(id), {}).toPromise();
  }
  //#endregion

  //#region User modification
  setUserNumber(teamId: number, userId: number, number: number) {
    return this.http
      .post(ServerRoutes.setUserNumber(userId, teamId), number)
      .toPromise();
  }
  removeUser(teamId: number, userId: number) {
    return this.http
      .delete(ServerRoutes.setUserNumber(userId, teamId))
      .toPromise();
  }
  //#endregion
}
