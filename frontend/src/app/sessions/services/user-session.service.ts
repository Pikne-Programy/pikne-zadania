import { Injectable } from '@angular/core';
import {
    isSessionExercises,
    SessionExercise,
    SESSION_FINISHED_ERROR
} from './session.utils';
import * as ServerRoutes from 'src/app/server-routes';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TYPE_ERROR } from 'src/app/helper/utils';
import { ExerciseService } from 'src/app/exercise-service/exercise.service';
import { Exercise } from 'src/app/exercise-service/exercises';

@Injectable({
    providedIn: 'root'
})
export class UserSessionService {
    constructor(
        private http: HttpClient,
        private exerciseService: ExerciseService
    ) {}

    private exerciseCache = new Map<string, Exercise>();
    getExerciseFromCache(
        subjectId: string,
        exerciseId: string
    ): Exercise | undefined {
        return this.exerciseCache.get(`${subjectId}-${exerciseId}`);
    }
    saveExerciseInCache(subjectId: string, exercise: Exercise) {
        this.exerciseCache.set(`${subjectId}-${exercise.id}`, exercise);
    }

    /**
     * Fetching exercises for students
     */
    getExercises(): Promise<SessionExercise[]> {
        return this.http
            .post(ServerRoutes.sessionListExercises, {})
            .pipe(
                switchMap((response) =>
                    isSessionExercises(response)
                        ? response.length > 0
                            ? of(response)
                            : throwError({ status: SESSION_FINISHED_ERROR })
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    /**
     * Fetching rendered exercise
     */
    getExercise(subjectId: string, exerciseId: string): Promise<Exercise> {
        const fromCache = this.getExerciseFromCache(subjectId, exerciseId);
        if (fromCache) return Promise.resolve(fromCache);

        return this.exerciseService.getExercise(subjectId, exerciseId);
    }
}
