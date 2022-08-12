import {
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnInit,
    Output
} from '@angular/core';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { ReportService } from 'src/app/sessions/services/report.service';
import { SessionService } from 'src/app/sessions/services/session.service';
import {
    ExerciseState,
    SessionStatus,
    SessionUser
} from 'src/app/sessions/services/session.utils';

type ViewSessionStatus = {
    finished: boolean;
    exercises: ViewStatusExercise[];
    users: SessionUser[];
};

type ViewStatusExercise = {
    subjectId: string;
    id: string;
    name: string;
};

@Component({
    selector: 'app-current-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.scss']
})
export class CurrentReportComponent implements OnInit {
    @Input() sessionStatus!: SessionStatus;
    @Input() teamId!: number;
    @Output() onClose = new EventEmitter();
    @Output() onSaved = new EventEmitter<string>();
    @HostBinding('class') readonly class = 'modal is-active';

    viewStatus?: ViewSessionStatus;
    get isTableEmpty() {
        return this.viewStatus
            ? this.viewStatus.exercises.length === 0 &&
                  this.viewStatus.users.length === 0
            : true;
    }

    isLoading = true;
    errorCode: number | null = null;
    constructor(
        private sessionService: SessionService,
        private reportService: ReportService
    ) {}

    //#region Save Modal
    isModalOpen = false;
    isModalSaveLoading = false;
    isModalEndSaveLoading = false;
    modalErrorCode: number | null = null;

    openSaveModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        if (!this.isModalSaveLoading && !this.isModalEndSaveLoading) {
            this.isModalOpen = false;
            this.modalErrorCode = null;
        }
    }

    onSaveClick() {
        if (this.viewStatus) {
            if (!this.viewStatus.finished) this.openSaveModal();
            else this.saveReport();
        }
        else this.errorCode = INTERNAL_ERROR;
    }
    //#endregion

    ngOnInit() {
        this.mapSessionStatus(this.sessionStatus)
            .then((viewStatus) => (this.viewStatus = viewStatus))
            .catch((error) => (this.errorCode = getErrorCode(error)))
            .finally(() => (this.isLoading = false));
    }

    getUserNumber(user: SessionUser): string {
        return user.number?.toString() ?? '';
    }

    getSessionState(viewStatus: ViewSessionStatus): string {
        return viewStatus.finished ? 'Zakończony' : 'W trakcie';
    }

    getExerciseStateColor(state: ExerciseState): string {
        let result = 'state-';
        switch (state) {
            case '☐':
                return '';
            case '☒':
                result += 'wrong';
                break;
            case '⚀':
                result += 'partial';
                break;
            case '☑':
                result += 'correct';
                break;
        }
        return result;
    }

    private async mapSessionStatus(
        status: SessionStatus
    ): Promise<ViewSessionStatus> {
        const exercises = await Promise.all(
            status.exercises.map(async (exercise) => {
                const viewExercise = await this.sessionService.getViewExercise(
                    exercise.subject,
                    exercise.exerciseId
                );
                return {
                    subjectId: exercise.subject,
                    id: exercise.exerciseId,
                    name: viewExercise.name
                };
            })
        );
        return {
            finished: status.finished,
            exercises,
            users: (await this.sessionService.getStatusUsers(status)).sort(
                (a, b) => {
                    if (a.number !== null && b.number !== null)
                        return a.number - b.number;
                    if (a.number === null && b.number !== null) return 1;
                    if (a.number !== null && b.number === null) return -1;
                    return a.name.localeCompare(b.name);
                }
            )
        };
    }

    countStateExercise(
        viewStatus: ViewSessionStatus,
        exerciseIndex: number,
        state: ExerciseState
    ): number {
        return viewStatus.users.reduce(
            (n, user) => (user.exercises[exerciseIndex] === state ? n + 1 : n),
            0
        );
    }

    countStateUser(user: SessionUser, state: ExerciseState): number {
        return user.exercises.reduce(
            (n, userState) => (userState === state ? n + 1 : n),
            0
        );
    }

    saveReport() {
        this.isModalSaveLoading = true;
        this.reportService
            .saveReport(this.teamId)
            .then((filename) => this.onSaved.emit(filename))
            .catch((error) => (this.modalErrorCode = getErrorCode(error)))
            .finally(() => (this.isModalSaveLoading = false));
    }

    endAndSaveReport() {
        this.isModalEndSaveLoading = true;
        this.sessionService
            .end(this.teamId)
            .then(() => this.reportService.saveReport(this.teamId))
            .then((filename) => this.onSaved.emit(filename))
            .catch((error) => (this.modalErrorCode = getErrorCode(error)))
            .finally(() => (this.isModalEndSaveLoading = false));
    }

    closeReport() {
        this.onClose.emit();
    }
}
