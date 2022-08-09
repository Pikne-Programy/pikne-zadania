import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { getErrorCode } from 'src/app/helper/utils';
import { ViewExercise } from 'src/app/subjects/dashboard/exercise-previews/preview.component';
import { SessionService } from '../../services/session.service';
import { SessionStatus, StatusExercise } from '../../services/session.utils';

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
                    .then(() => this.sessionService.getStatus(teamId))
                    .then((sessionStatus) => {
                        this.sessionStatus = sessionStatus;
                        this.isSessionFinished = sessionStatus.finished;
                        return this.getViewExercises(sessionStatus.exercises);
                    })
                    .then((exercises) => (this.exerciseList = exercises))
                    .catch((error) => (this.errorCode = getErrorCode(error)))
                    .finally(() => (this.isLoading = false));
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

    isLast(index: number): boolean {
        if (!this.exerciseList) return false;
        return index === this.exerciseList.length - 1;
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }
}
