import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { Exercise } from './exercises';
import { Role, RoleGuardService } from '../guards/role-guard.service';
import * as ServerRoutes from '../server-routes';
import { ServerResponseNode, Subject } from './exercise.utils';
import { TYPE_ERROR } from '../helper/utils';

@Injectable({
    providedIn: 'root'
})
export class ExerciseService {
    constructor(
        private http: HttpClient,
        private accountService: AccountService
    ) {}

    private createExerciseTree(serverResponse: ServerResponseNode) {
        const account = this.accountService.currentAccount.getValue();
        const isUser = account
            ? RoleGuardService.getRole(account) === Role.USER
            : true;
        return Subject.createSubject(serverResponse, isUser);
    }

    getExerciseTree(subjectId: string) {
        return this.http
            .post(ServerRoutes.exerciseList, { id: subjectId })
            .pipe(
                switchMap((response) => {
                    const subject = { name: subjectId, children: response };
                    if (Subject.checkSubjectValidity(subject)) {
                        const tree = this.createExerciseTree(subject);
                        return tree
                            ? of(tree)
                            : throwError({ status: TYPE_ERROR });
                    }
                    else
                        return throwError({ status: TYPE_ERROR });

                })
            )
            .toPromise();
    }

    getExercise(subjectId: string, id: string, seed?: number) {
        return this.http
            .post(ServerRoutes.exerciseRender, {
                id: `${subjectId}/${id}`,
                seed
            })
            .pipe(
                switchMap((response) => {
                    if (Exercise.isExercise(response, id, subjectId)) {
                        Exercise.getDone(response, subjectId);
                        return of(response);
                    }
                    else
                        return throwError({ status: TYPE_ERROR });

                })
            )
            .toPromise();
    }

    submitAnswers<T>(
        subject: string,
        id: string,
        answers: any,
        typeChecker: (obj: any, ...args: any[]) => obj is T,
        ...typeCheckerArgs: any[]
    ) {
        return this.http
            .post(ServerRoutes.exerciseCheck, {
                id: `${subject}/${id}`,
                answers
            })
            .pipe(
                switchMap((response) =>
                    typeChecker(response, ...typeCheckerArgs)
                        ? of(response)
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }
}
