import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Exercise } from 'src/app/exercise-service/exercises';

export type SubmitButtonState = 'active' | 'loading' | 'disabled';

export interface ExerciseComponentType {
  loaded: BehaviorSubject<number | null>;
  exercise: Exercise | null;
  submitAnswers: () => Promise<any>;
  submitButtonState: EventEmitter<SubmitButtonState>;
  setLocalDone: (name: string, answers: any) => void;
}

@Injectable({
    providedIn: 'root'
})
export class ExerciseInflationService {
  static readonly InflationError = 480;

  private _exercise: Exercise | null = null;

  getExercise<T extends Exercise>() {
      return this._exercise ? (this._exercise as T) : null;
  }

  setExercise(exercise: Exercise) {
      this._exercise = exercise;
  }

  resetExercise() {
      this._exercise = null;
  }
}
