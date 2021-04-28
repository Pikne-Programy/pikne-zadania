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
  private readonly TypeError = 400;

  constructor(private http: HttpClient) {}

  //#region Fetching
  getTeams() {
    return this.http
      .get(ServerRoutes.teams)
      .pipe(
        switchMap((response) =>
          response && Utils.isTeamItemList(response)
            ? of(response)
            : throwError({ status: this.TypeError })
        )
      )
      .toPromise();
  }

  getTeam(id: number) {
    return this.http
      .get(ServerRoutes.team(id))
      .pipe(
        switchMap((response) => {
          if (response && Utils.isTeam(response)) {
            response.members.sort((a, b) => {
              if (a.number !== null && b.number !== null)
                return a.number - b.number;
              if (a.number === null && b.number !== null) return 1;
              if (a.number !== null && b.number === null) return -1;
              return a.name.localeCompare(b.name);
            });
            return of(response);
          } else return throwError({ status: this.TypeError });
        })
      )
      .toPromise();
  }

  getAssigneeList() {
    const TeacherTeamId = 1;
    return this.http
      .get(ServerRoutes.team(TeacherTeamId))
      .pipe(
        switchMap((response) =>
          response && Utils.isTeam(response)
            ? of(response.members)
            : throwError({ status: this.TypeError })
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
            : throwError({ status: this.TypeError })
        )
      )
      .toPromise();
  }
  setTeamName(id: number, name: string) {
    return this.http
      .post(ServerRoutes.setTeamName(id), JSON.stringify(name))
      .toPromise();
  }
  setAssignee(id: number, assignee: string) {
    return this.http
      .post(ServerRoutes.changeTeamAssignee(id), JSON.stringify(assignee))
      .toPromise();
  }
  //#endregion

  //#region Registration
  openTeam(id: number, code: string | null) {
    if (code !== null) code = code.trim();
    return this.http
      .post(
        ServerRoutes.openTeam(id),
        JSON.stringify(code !== null && code.length > 0 ? code : null)
      )
      .toPromise();
  }
  closeTeam(id: number) {
    return this.http.post(ServerRoutes.closeTeam(id), {}).toPromise();
  }
  //#endregion

  //#region User modification
  setUserNumber(teamId: number, userId: string, newNumber: number | null) {
    return this.http
      .post(
        ServerRoutes.setUserNumber(userId, teamId),
        JSON.stringify(newNumber)
      )
      .toPromise();
  }
  removeUser(teamId: number, userId: string) {
    return this.http
      .delete(ServerRoutes.deleteFromTeam(userId, teamId))
      .toPromise();
  }
  //#endregion
}
