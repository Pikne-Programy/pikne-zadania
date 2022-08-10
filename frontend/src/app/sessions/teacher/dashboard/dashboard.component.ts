import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { ViewExercise } from 'src/app/subjects/dashboard/exercise-previews/preview.component';
import { SessionService } from '../../services/session.service';
import { SessionStatus, StatusExercise } from '../../services/session.utils';

enum Modal {
    REPORT,
    END,
    RESET,
    REPORT_SAVED
}

@Component({
    selector: 'app-session-teacher-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class SessionTeacherDashboardComponent implements OnInit, OnDestroy {
    teamId?: number;
    team?: string;
    private sessionStatus?: SessionStatus;
    exerciseList?: ViewExercise[];
    isSessionFinished?: boolean;

    //#region Modals
    readonly MODALS = Modal;
    private _openedModal: Modal | null = null;
    get openedModal() {
        return this._openedModal;
    }
    isModalLoading = false;
    modalErrorCode: number | null = null;

    openModal(modal: Modal) {
        this._openedModal = modal;
    }
    closeModal() {
        if (!this.isModalLoading) {
            this._openedModal = null;
            this.modalErrorCode = null;
        }
    }
    //#endregion

    isLoading = true;
    errorCode: number | null = null;
    isExerciseLoading = false;
    exerciseErrorCode: number | null = null;

    param$?: Subscription;
    constructor(
        private sessionService: SessionService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const teamId = Number(params.get('teamId'));
            if (!isNaN(teamId)) {
                this.teamId = teamId;
                this.sessionService
                    .getTeamName(teamId)
                    .then((teamName) => (this.team = teamName))
                    .then(() => this.refreshStatus())
                    .catch((error) => (this.errorCode = getErrorCode(error)));
                this.param$?.unsubscribe();
            }
        });
    }

    private getViewExercises(
        sessionExercises: StatusExercise[]
    ): Promise<ViewExercise[]> {
        return Promise.all(
            sessionExercises.map((exercise) =>
                this.sessionService.getViewExercise(
                    exercise.subject,
                    exercise.exerciseId
                )
            )
        );
    }

    getExerciseSubject(index: number): string {
        return this.sessionStatus!.exercises[index].subject;
    }

    refreshStatus() {
        if (this.teamId) {
            this.isLoading = true;
            this.errorCode = null;
            return this.sessionService
                .getStatus(this.teamId)
                .then((sessionStatus) => {
                    this.sessionStatus = sessionStatus;
                    this.isSessionFinished = sessionStatus.finished;
                    return this.getViewExercises(sessionStatus.exercises);
                })
                .then((exercises) => (this.exerciseList = exercises))
                .catch((error) => (this.errorCode = getErrorCode(error)))
                .finally(() => (this.isLoading = false));
        }
        return Promise.reject({ status: INTERNAL_ERROR });
    }

    endSession() {
        if (this.teamId === undefined) {
            this.closeModal();
            return;
        }

        this.sessionService
            .end(this.teamId)
            .then(() => this.refreshStatus())
            .then(() => {
                this.isModalLoading = false;
                this.closeModal();
            })
            .catch((error) => {
                this.isModalLoading = false;
                this.modalErrorCode = getErrorCode(error);
            });
    }

    resetSession() {
        if (this.teamId === undefined) {
            this.closeModal();
            return;
        }

        this.sessionService
            .reset(this.teamId)
            .then(() => this.refreshStatus())
            .then(() => {
                this.isModalLoading = false;
                this.closeModal();
            })
            .catch((error) => {
                this.isModalLoading = false;
                this.modalErrorCode = getErrorCode(error);
            });
    }

    isLast(index: number): boolean {
        if (!this.exerciseList) return false;
        return index === this.exerciseList.length - 1;
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }
}
