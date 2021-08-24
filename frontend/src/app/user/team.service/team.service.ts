import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as Utils from './types';
import * as ServerRoutes from '../../server-routes';
import { switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { TypeError } from 'src/app/helper/utils';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly PermissionError = 403;

  constructor(private http: HttpClient) {}

  //#region Fetching
  getTeams() {
    return this.http
      .get(ServerRoutes.teamList)
      .pipe(
        switchMap((response) =>
          Utils.isTeamItemList(response)
            ? of(response)
            : throwError({ status: TypeError })
        )
      )
      .toPromise();
  }

  getTeam(id: number) {
    return this.http
      .post(ServerRoutes.team, { id })
      .pipe(
        switchMap((response) => {
          if (Utils.isTeam(response)) {
            response.members?.sort((a, b) => {
              if (a.number !== null && b.number !== null)
                return a.number - b.number;
              if (a.number === null && b.number !== null) return 1;
              if (a.number !== null && b.number === null) return -1;
              return a.name.localeCompare(b.name);
            });
            return of(response);
          } else return throwError({ status: TypeError });
        })
      )
      .toPromise();
  }

  getAssigneeList() {
    const TeacherTeamId = 1;
    return this.http
      .post(ServerRoutes.team, { id: TeacherTeamId })
      .pipe(
        switchMap((response) =>
          Utils.isTeam(response)
            ? response.members
              ? of(response.members)
              : throwError({ status: this.PermissionError })
            : throwError({ status: TypeError })
        )
      )
      .toPromise();
  }
  //#endregion

  //#region Team modification
  createTeam(name: string) {
    return this.http
      .post(ServerRoutes.teamCreate, { name })
      .pipe(
        switchMap((response) =>
          typeof response === 'number'
            ? of(response)
            : throwError({ status: TypeError })
        )
      )
      .toPromise();
  }
  deleteTeam(id: number) {
    return this.http.post(ServerRoutes.teamDelete, { id }).toPromise();
  }
  setTeamName(id: number, name: string) {
    return this.http.post(ServerRoutes.teamUpdate, { id, name }).toPromise();
  }
  setAssignee(id: number, assignee: string) {
    return this.http
      .post(ServerRoutes.teamUpdate, { id, assignee })
      .toPromise();
  }
  //#endregion

  //#region Registration
  openTeam(id: number, code: string) {
    code = code.trim();
    return this.http
      .post(ServerRoutes.teamUpdate, {
        id,
        invitation: code,
      })
      .toPromise();
  }
  closeTeam(id: number) {
    return this.http
      .post(ServerRoutes.teamUpdate, { id, invitation: null })
      .toPromise();
  }
  //#endregion

  //#region User modification
  editUser(id: string, newName?: string, newNumber?: number | null) {
    return this.http
      .post(ServerRoutes.userUpdate, {
        id,
        name: newName,
        number: newNumber,
      })
      .toPromise();
  }
  removeUser(id: string) {
    return this.http.post(ServerRoutes.userDelete, { id }).toPromise();
  }
  //#endregion
}
