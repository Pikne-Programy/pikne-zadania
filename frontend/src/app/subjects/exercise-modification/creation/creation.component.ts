import { Component, OnDestroy, OnInit } from '@angular/core';
import { getErrorCode } from 'src/app/helper/utils';
import { ExerciseModComponent } from '../exercise-modification.component';
import { Exercise } from '../service/exercise-modification.service';

@Component({
  selector: 'app-creation',
  templateUrl: '../exercise-modification.component.html',
  styleUrls: ['../exercise-modification.component.scss'],
})
export class ExerciseCreationComponent
  extends ExerciseModComponent
  implements OnInit, OnDestroy
{
  exerciseId: string | null = null;

  get errorCode(): number | null {
    if (this.isLoading) return null;
    if (!this.subjectId) return this.SubjectError;
    return this._errorCode;
  }

  ngOnInit() {
    this.param$ = this.route.paramMap.subscribe((params) => {
      const subjectId = params.get('subjectId');
      if (subjectId) {
        this.subjectId = subjectId;
        this.exercise = new Exercise();

        this.exerciseService
          .getAllExercises(subjectId)
          .then((list) => (this.exerciseSet = list))
          .catch((error) => (this._errorCode = getErrorCode(error)))
          .finally(() => (this.isLoading = false));
        this.param$?.unsubscribe();
      }
    });
  }

  getErrorMessage(_: number) {
    return undefined;
  }
}
