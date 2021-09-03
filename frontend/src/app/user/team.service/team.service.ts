import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as Utils from './types';
import * as ServerRoutes from '../../server-routes';
import { switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { isObject, TYPE_ERROR } from 'src/app/helper/utils';

@Injectable({
    providedIn: 'root'
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
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    getTeam(id: number) {
        return this.http
            .post(ServerRoutes.teamInfo, { teamId: id })
            .pipe(
                switchMap((response) => {
                    if (Utils.isTeam(response)) {
                        response.members?.sort((a, b) => {
                            if (a.number !== null && b.number !== null)
                                return a.number - b.number;
                            if (a.number === null && b.number !== null)
                                return 1;
                            if (a.number !== null && b.number === null)
                                return -1;
                            return a.name.localeCompare(b.name);
                        });
                        return of(response);
                    }
                    else return throwError({ status: TYPE_ERROR });
                })
            )
            .toPromise();
    }

    getAssigneeList() {
        const TEACHER_TEAM_ID = 1;
        return this.http
            .post(ServerRoutes.teamInfo, { teamId: TEACHER_TEAM_ID })
            .pipe(
                switchMap((response) =>
                    Utils.isTeam(response)
                        ? response.members
                            ? of(response.members)
                            : throwError({ status: this.PermissionError })
                        : throwError({ status: TYPE_ERROR })
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
                    isObject<{ teamId: number }>(response, [
                        ['teamId', ['number']]
                    ])
                        ? of(response)
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }
    deleteTeam(teamId: number) {
        return this.http
            .post(ServerRoutes.teamDelete, { teamId })
            .toPromise();
    }
    setTeamName(teamId: number, name: string) {
        return this.http
            .post(ServerRoutes.teamUpdate, { teamId, name })
            .toPromise();
    }
    setAssignee(teamId: number, assigneeId: string) {
        return this.http
            .post(ServerRoutes.teamUpdate, { teamId, assignee: assigneeId })
            .toPromise();
    }
    //#endregion

    //#region Registration
    openTeam(teamId: number, code: string) {
        code = code.trim();
        return this.http
            .post(ServerRoutes.teamUpdate, {
                teamId,
                invitation: code
            })
            .toPromise();
    }
    closeTeam(teamId: number) {
        return this.http
            .post(ServerRoutes.teamUpdate, { teamId, invitation: null })
            .toPromise();
    }
    //#endregion

    //#region User modification
    editUser(userId: string, newName?: string, newNumber?: number | null) {
        return this.http
            .post(ServerRoutes.userUpdate, {
                userId,
                name: newName,
                number: newNumber
            })
            .toPromise();
    }
    removeUser(userId: string) {
        return this.http
            .post(ServerRoutes.userDelete, { userId })
            .toPromise();
    }
    //#endregion
}
