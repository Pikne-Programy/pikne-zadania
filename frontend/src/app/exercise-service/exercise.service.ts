import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Exercise } from '../exercises/exercises';
import { getErrorCode } from '../helper/utils';
import * as ServerRoutes from '../server-routes';
import { Subject } from './exercise.utils';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly TypeError = 400;

  constructor(private http: HttpClient) {}

  private fetchExercises() {
    return this.http
      .get(ServerRoutes.publicExerciseList)
      .pipe(
        switchMap((response) =>
          Subject.checkSubjectListValidity(response)
            ? of(response)
            : throwError({ status: 400 })
        )
      )
      .toPromise();
  }

  getSubjectList() {
    return this.fetchExercises()
      .then((response) =>
        response.length > 0
          ? Subject.createSubjectList(response) ?? this.TypeError
          : this.TypeError
      )
      .catch((error) => getErrorCode(error, this.TypeError));
  }

  findSubjectById(id: string, subjectList: Subject[]): Subject | null {
    return subjectList.find((subject) => subject.name === id) ?? null;
  }

  getExercise(subject: string, id: string) {
    return this.http
      .get(ServerRoutes.exercise(subject, id))
      .pipe(
        switchMap((response) => {
          if (Exercise.isExercise(response)) {
            Exercise.getDone(response);
            return of(response);
          } else return throwError({ status: this.TypeError });
        })
      )
      .toPromise();
  }

  submitAnswers(subject: string, id: string, answers: any) {
    return this.http
      .post(ServerRoutes.exercise(subject, id), answers)
      .toPromise();
  }
}
