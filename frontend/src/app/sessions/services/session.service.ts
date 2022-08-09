import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Exercise } from 'src/app/exercise-service/exercises';
import { TYPE_ERROR } from 'src/app/helper/utils';
import { ViewExercise } from 'src/app/subjects/dashboard/exercise-previews/preview.component';
import { isTeam } from 'src/app/user/team.service/types';
import * as ServerRoutes from '../../server-routes';
import {
    isSessionExercises,
    isSessionStatus,
    mapExercise,
    SessionExercises,
    SessionStatus
} from './session.utils';

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    readonly SESSION_FINISHED_SERVER_ERROR = 409;
    readonly SESSION_FINISHED_ERROR = 40009;
    private readonly EXERCISE_TYPE_ERROR = 40890;
    private readonly TEAM_ERROR = 48900;

    // subjectCache = new Map<string, ViewExerciseTreeNode>()
    private exerciseCache = new Map<string, ViewExercise>();
    getExerciseFromCache(
        subjectId: string,
        exerciseId: string
    ): ViewExercise | undefined {
        return this.exerciseCache.get(`${subjectId}-${exerciseId}`);
    }
    saveExerciseInCache(subjectId: string, exercise: ViewExercise) {
        this.exerciseCache.set(`${subjectId}-${exercise.id}`, exercise);
    }

    constructor(private http: HttpClient) {}

    getStatus(teamId: number): Promise<SessionStatus> {
        return this.http
            .post(ServerRoutes.sessionStatus, { teamId })
            .pipe(
                switchMap((response) =>
                    isSessionStatus(response)
                        ? of(response)
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    getViewExercise(
        subjectId: string,
        exerciseId: string
    ): Promise<ViewExercise> {
        const fromCache = this.getExerciseFromCache(subjectId, exerciseId);
        if (fromCache) return Promise.resolve(fromCache);

        return this.http
            .post(ServerRoutes.exerciseGet, {
                subject: subjectId,
                exerciseId
            })
            .pipe(
                switchMap((response) => {
                    if (Exercise.isExercise(response, exerciseId, subjectId)) {
                        const exercise = mapExercise(response, exerciseId);
                        this.saveExerciseInCache(subjectId, exercise);
                        return of(exercise);
                    }
                    else
                        return throwError({ status: this.EXERCISE_TYPE_ERROR });
                })
            )
            .toPromise();
    }

    getTeamName(teamId: number): Promise<string> {
        return this.http
            .post(ServerRoutes.teamInfo, { teamId })
            .pipe(
                switchMap((response) =>
                    isTeam(response)
                        ? of(response.name)
                        : throwError({ status: this.TEAM_ERROR })
                )
            )
            .toPromise();
    }

    //#region Session modification
    reset(teamId: number) {
        return this.http
            .post(ServerRoutes.sessionReset, { teamId })
            .toPromise();
    }

    addExercise(teamId: number, subject: string, exercise: ViewExercise) {
        return this.http
            .post(ServerRoutes.sessionAddExercise, {
                teamId,
                subject,
                exerciseId: exercise.id
            })
            .toPromise();
    }

    deleteExercise(teamId: number, subject: string, exerciseId: string) {
        return this.http
            .post(ServerRoutes.sessionRemoveExercise, {
                teamId,
                subject,
                exerciseId
            })
            .toPromise();
    }
    //#endregion

    /**
     * Fetching exercises for students
     */
    getExercises(): Promise<SessionExercises> {
        return this.http
            .post(ServerRoutes.sessionListExercises, {})
            .pipe(
                switchMap((response) =>
                    isSessionExercises(response)
                        ? response.length > 0
                            ? of(response)
                            : throwError({
                                status: this.SESSION_FINISHED_ERROR
                            })
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }
}
