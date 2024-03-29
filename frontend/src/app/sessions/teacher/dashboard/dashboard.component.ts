import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { ViewExercise } from 'src/app/subjects/dashboard/exercise-previews/preview.component';
import { ReportService } from '../../services/report.service';
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
    sessionStatus?: SessionStatus;
    exerciseList?: ViewExercise[];
    isSessionFinished?: boolean;

    //#region Modals
    readonly MODALS = Modal;
    private _openedModal: Modal | null = null;
    get openedModal() {
        return this._openedModal;
    }
    modalData?: string;
    isModalLoading = false;
    isModalSecondaryLoading = false;
    modalErrorCode: number | null = null;

    openModal(modal: Modal) {
        if (modal !== Modal.REPORT) this._openedModal = modal;
        else this.refreshStatus().then(() => (this._openedModal = modal));
    }

    openSavedModal(filename: string) {
        this.isModalLoading = false;
        this.isModalSecondaryLoading = false;
        this.modalErrorCode = null;

        this.refreshStatus();
        this.modalData = filename;
        this._openedModal = Modal.REPORT_SAVED;
    }

    closeModal() {
        if (!this.isModalLoading && !this.isModalSecondaryLoading) {
            this.refreshStatus();
            this._openedModal = null;
            this.modalErrorCode = null;
            this.modalData = undefined;
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
        private reportService: ReportService,
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

    refreshStatus(): Promise<ViewExercise[]> {
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
                .catch((error) => {
                    this.errorCode = getErrorCode(error);
                    throw error;
                })
                .finally(() => (this.isLoading = false));
        }
        return Promise.reject({ status: INTERNAL_ERROR });
    }

    endSession() {
        if (this.teamId === undefined) {
            this.closeModal();
            return;
        }

        this.isModalLoading = true;
        this.sessionService
            .end(this.teamId)
            .then(() => {
                this.isModalLoading = false;
                this.closeModal();
            })
            .catch((error) => {
                this.isModalLoading = false;
                this.modalErrorCode = getErrorCode(error);
            });
    }

    endSessionAndSave() {
        if (this.teamId === undefined) {
            this.closeModal();
            return;
        }
        const teamId = this.teamId;

        this.isModalSecondaryLoading = true;
        this.sessionService
            .end(teamId)
            .then(() => this.refreshStatus())
            .then(() => this.reportService.saveReport(teamId))
            .then((filename) => this.openSavedModal(filename))
            .catch((error) => (this.modalErrorCode = getErrorCode(error)))
            .finally(() => (this.isModalSecondaryLoading = false));
    }

    resetSession() {
        if (this.teamId === undefined) {
            this.closeModal();
            return;
        }

        this.isModalLoading = true;
        this.sessionService
            .reset(this.teamId)
            .then(() => {
                this.isModalLoading = false;
                this.closeModal();
            })
            .catch((error) => {
                this.isModalLoading = false;
                this.modalErrorCode = getErrorCode(error);
            });
    }

    downloadReport() {
        const filename = this.modalData;
        if (filename) {
            this.isModalLoading = true;
            this.reportService
                .getReport(filename)
                .then(() => {
                    this.isModalLoading = false;
                    this.closeModal();
                })
                .catch((error) => {
                    this.modalErrorCode = getErrorCode(error);
                    this.isModalLoading = false;
                });
        }
        else this.errorCode = INTERNAL_ERROR;
    }

    isLast(index: number): boolean {
        if (!this.exerciseList) return false;
        return index === this.exerciseList.length - 1;
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }
}
