import { Component, OnInit } from '@angular/core';
import { Exercise } from 'src/app/exercise-service/exercises';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import {
    EXERCISE_NOT_FOUND_SERVER_ERROR,
    SessionExercise,
    SESSION_FINISHED_ERROR
} from '../../services/session.utils';
import { UserSessionService } from '../../services/user-session.service';

@Component({
    selector: 'app-session-user-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class SessionUserDashboardComponent implements OnInit {
    exerciseList?: SessionExercise[];
    currentExercise: Exercise | null = null;

    isPristine = true;
    isLoading = true;
    errorCode: number | null = null;
    isExerciseLoading = false;
    exerciseErrorCode: number | null = null;
    isRefreshing = false;

    constructor(private sessionService: UserSessionService) {}

    ngOnInit() {
        this.getSession()
            .then(() => {
                if (!this.exerciseList) {
                    this.errorCode = INTERNAL_ERROR;
                    throw { status: INTERNAL_ERROR };
                }
                this.isLoading = false;
                this.isExerciseLoading = true;
                const exercise = this.exerciseList[0];
                return this.getExercise(exercise);
            })
            .catch(() => {});
    }

    private getSession(): Promise<SessionExercise[]> {
        return this.sessionService
            .getExercises()
            .then((list) => (this.exerciseList = list))
            .catch((error) => {
                this.errorCode = getErrorCode(error);
                return Promise.reject(error);
            })
            .finally(() => {
                this.isLoading = false;
                this.isRefreshing = false;
            });
    }

    private getExercise(sessionExercise: SessionExercise) {
        this.sessionService
            .getExercise(sessionExercise.subject, sessionExercise.exerciseId)
            .then((exercise) => (this.currentExercise = exercise))
            .catch((error) => {
                if (this.errorCode === null)
                    this.exerciseErrorCode = getErrorCode(error);
                return Promise.reject(error);
            })
            .finally(() => (this.isExerciseLoading = false));
    }

    refreshSessionState(
        setLoading: boolean = false,
        isFromSelection: boolean = false
    ): Promise<unknown> {
        this.isPristine = false;
        if (setLoading) this.isRefreshing = true;
        if (isFromSelection) return this.getSession();
        else return this.getSession().catch(() => {});
    }

    selectExercise(exercise: SessionExercise) {
        this.refreshSessionState(false, true)
            .then(() => this.getExercise(exercise))
            .catch(() => {});
    }

    isExerciseSelected(exercise: SessionExercise): boolean {
        return exercise.exerciseId === this.currentExercise?.id;
    }

    resetExercise() {
        this.currentExercise = null;
    }

    getErrorCode(errorCode: number): number | undefined {
        switch (errorCode) {
            case SESSION_FINISHED_ERROR:
                return undefined;
            default:
                return errorCode;
        }
    }

    getErrorMessage(errorCode: number): string | undefined {
        switch (errorCode) {
            case SESSION_FINISHED_ERROR:
                return this.isPristine
                    ? 'Brak trwających testów'
                    : 'Test został zakończony';
            default:
                return undefined;
        }
    }

    getExerciseErrorMessage(errorCode: number): string | undefined {
        switch (errorCode) {
            case EXERCISE_NOT_FOUND_SERVER_ERROR:
                return 'Zadanie, którego szukasz, nie istnieje!';
            default:
                return undefined;
        }
    }
}
