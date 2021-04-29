import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { Exercise, ExerciseType } from '../exercises/exercises';
import { Role, RoleGuardService } from '../guards/role-guard.service';
import { getErrorCode } from '../helper/utils';
import * as ServerRoutes from '../server-routes';
import { Subject } from './exercise.utils';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly TypeError = 400;
  private readonly AnswerFormatError = 420;

  constructor(
    private http: HttpClient,
    private accountService: AccountService
  ) {}

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
      .then((response) => {
        const account = this.accountService.currentAccount.getValue();
        const isUser = account
          ? RoleGuardService.getRole(account) === Role.USER
          : true;
        return response.length > 0
          ? Subject.createSubjectList(response, isUser) ?? this.TypeError
          : this.TypeError;
      })
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
