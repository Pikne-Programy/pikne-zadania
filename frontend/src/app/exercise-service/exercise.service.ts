import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { Exercise } from '../exercises/exercises';
import { Role, RoleGuardService } from '../guards/role-guard.service';
import * as ServerRoutes from '../server-routes';
import { Subject } from './exercise.utils';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly TypeError = 400;
  private readonly LengthError = 419;

  constructor(
    private http: HttpClient,
    private accountService: AccountService
  ) {}

  private fetchExercises() {
    return this.http
      .get(ServerRoutes.exerciseList)
      .pipe(
        switchMap((response) =>
          Subject.checkSubjectListValidity(response)
            ? of(response)
            : throwError({ status: this.TypeError })
        )
      )
      .toPromise();
  }

  getSubjectList() {
    return this.fetchExercises().then((response) => {
      const account = this.accountService.currentAccount.getValue();
      const isUser = account
        ? RoleGuardService.getRole(account) === Role.USER
        : true;

      if (response.length <= 0)
        return Promise.reject({ status: this.LengthError });

      return (
        Subject.createSubjectList(response, isUser) ??
        Promise.reject({ status: this.TypeError })
      );
    });
  }

  findSubjectById(id: string, subjectList: Subject[]): Subject | null {
    return subjectList.find((subject) => subject.name === id) ?? null;
  }

  getExercise(subject: string, id: string, seed?: number) {
    return this.http
      .post(ServerRoutes.exerciseRender, { id: `${subject}/${id}`, seed: seed })
      .pipe(
        switchMap((response) => {
          if (Exercise.isExercise(response)) {
            Exercise.getDone(response, subject);
            return of(response);
          } else return throwError({ status: this.TypeError });
        })
      )
      .toPromise();
  }

  submitAnswers(subject: string, id: string, answers: any) {
    return this.http
      .post(ServerRoutes.exerciseCheck, {
        id: `${subject}/${id}`,
        answers: answers,
      })
      .toPromise();
  }
}
