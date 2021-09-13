import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { Exercise } from './exercises';
import { Role, RoleGuardService } from '../guards/role-guard.service';
import * as ServerRoutes from '../server-routes';
import { ServerResponseNode, Subject } from './exercise.utils';
import { isObject, ObjectType, TYPE_ERROR } from '../helper/utils';

type AnswersResponseType = {
    info: any;
};

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
            .post(ServerRoutes.exerciseList, { subject: subjectId, raw: false })
            .pipe(
                switchMap((response) => {
                    const subject = { name: subjectId, children: response };
                    if (Subject.checkSubjectValidity(subject)) {
                        const tree = this.createExerciseTree(subject);
                        return tree
                            ? of(tree)
                            : throwError({ status: TYPE_ERROR });
                    }
                    else return throwError({ status: TYPE_ERROR });
                })
            )
            .toPromise();
    }

    getExercise(subjectId: string, id: string, seed?: number) {
        return this.http
            .post(ServerRoutes.exerciseGet, {
                subject: subjectId,
                exerciseId: id,
                seed
            })
            .pipe(
                switchMap((response) => {
                    if (Exercise.isExercise(response, id, subjectId)) {
                        Exercise.getDone(response, subjectId);
                        return of(response);
                    }
                    else return throwError({ status: TYPE_ERROR });
                })
            )
            .toPromise();
    }

    submitAnswers<T extends ObjectType, U>(
        subject: string,
        id: string,
        answer: T,
        typeChecker: (obj: any, ...args: any[]) => obj is U,
        ...typeCheckerArgs: any[]
    ) {
        return this.http
            .post(ServerRoutes.exerciseCheck, {
                subject,
                exerciseId: id,
                answer
            })
            .pipe(
                switchMap((response) =>
                    isObject<AnswersResponseType>(response, [
                        ['info', 'any']
                    ]) && typeChecker(response.info, ...typeCheckerArgs)
                        ? of(response.info)
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }
}
