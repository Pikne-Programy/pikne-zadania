import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Exercise } from 'src/app/exercise-service/exercises';
import { getErrorCode, TYPE_ERROR } from 'src/app/helper/utils';
import { ViewExercise } from 'src/app/subjects/dashboard/exercise-previews/preview.component';
import {
    Subject,
    SubjectService,
    ViewExerciseTreeNode
} from 'src/app/subjects/subject.service/subject.service';
import { isTeam } from 'src/app/user/team.service/types';
import * as ServerRoutes from '../../server-routes';
import {
    isSessionStatus,
    isUser,
    mapExercise,
    mapUser,
    SessionStatus,
    SessionUser
} from './session.utils';

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    private readonly EXERCISE_TYPE_ERROR = 40890;
    private readonly TEAM_ERROR = 48900;

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

    private userCache = new Map<string, SessionUser>();

    constructor(
        private http: HttpClient,
        private subjectService: SubjectService
    ) {}

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

    getStatusUsers(status: SessionStatus): Promise<SessionUser[]> {
        return Promise.all(
            status.report.map(async (statusUser) => {
                const fromCache = this.userCache.get(statusUser.userId);
                if (fromCache) return fromCache;

                return this.http
                    .post(ServerRoutes.userInfo, { userId: statusUser.userId })
                    .pipe(
                        switchMap((response) =>
                            isUser(response)
                                ? of(mapUser(statusUser, response))
                                : throwError({ status: TYPE_ERROR })
                        )
                    )
                    .toPromise()
                    .then((user) => {
                        this.userCache.set(user.userId, user);
                        return user;
                    })
                    .catch((error) => {
                        console.error(
                            `User error (${getErrorCode(error)})`,
                            error
                        );
                        throw error;
                    });
            })
        );
    }

    //#region Session modification
    end(teamId: number) {
        return this.http.post(ServerRoutes.sessionEnd, { teamId }).toPromise();
    }

    reset(teamId: number) {
        return this.http
            .post(ServerRoutes.sessionReset, { teamId })
            .toPromise();
    }

    getSubjects(): Promise<Subject[]> {
        return this.subjectService.getSubjects();
    }

    getSubjectExercises(subjectId: string): Promise<ViewExerciseTreeNode> {
        return this.subjectService.getExerciseTree(subjectId, true);
    }

    /**
     * @returns First - subjectId; Second - exercise
     */
    getAddedExercises(teamId: number): Promise<[string, ViewExercise][]> {
        return this.getStatus(teamId).then((sessionStatus) =>
            Promise.all(
                sessionStatus.exercises.map(async (statusExercise) => {
                    const exercise = await this.getViewExercise(
                        statusExercise.subject,
                        statusExercise.exerciseId
                    );
                    return [statusExercise.subject, exercise];
                })
            )
        );
    }

    addExercise(teamId: number, subject: string, exercise: ViewExercise) {
        return this.http
            .post(ServerRoutes.sessionAddExercise, {
                teamId,
                subject,
                exerciseId: exercise.id
            })
            .toPromise()
            .then(() => this.saveExerciseInCache(subject, exercise));
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
}
