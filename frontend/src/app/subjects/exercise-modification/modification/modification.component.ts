import { Component, OnDestroy, OnInit } from '@angular/core';
import { getErrorCode } from 'src/app/helper/utils';
import { ExerciseModComponent } from '../exercise-modification.component';

@Component({
    selector: 'app-exercise-modification',
    templateUrl: '../exercise-modification.component.html',
    styleUrls: ['../exercise-modification.component.scss']
})
export class ExerciseModificationComponent
    extends ExerciseModComponent
    implements OnInit, OnDestroy {
    exerciseSet: Set<string> | null = null;

    get errorCode(): number | null {
        if (this.isLoading) return null;
        if (!this.subjectId) return this.SubjectError;
        if (!this.exerciseId) return this.ExerciseError;
        return this._errorCode;
    }

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const subjectId = params.get('subjectId');
            const exerciseId = params.get('exerciseId');
            if (subjectId && exerciseId) {
                this.subjectId = subjectId;
                this.exerciseId = exerciseId;
                this.exerciseService
                    .getExercise(subjectId, exerciseId)
                    .then((exercise) => (this.exercise = exercise))
                    .catch((error) => (this._errorCode = getErrorCode(error)))
                    .finally(() => (this.isLoading = false));
                this.param$?.unsubscribe();
            }
        });
    }

    getErrorMessage(errorCode: number) {
        switch (errorCode) {
            case 404:
                return 'Ups, zadanie, którego szukasz, nie istnieje!';
            default:
                return undefined;
        }
    }
}
