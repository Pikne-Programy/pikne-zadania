/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { HttpClient } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { Account, AccountService } from '../account/account.service';
import { Role, RoleGuardService } from '../guards/role-guard.service';
import { ExerciseService } from './exercise.service';
import {
    ExerciseTreeNode,
    ServerResponseNode,
    Subject
} from './exercise.utils';
import * as ServerRoutes from '../server-routes';
import { TYPE_ERROR } from '../helper/utils';
import { EqEx, Exercise } from './exercises';

describe('Service: Exercise', () => {
    let httpController: HttpTestingController;
    const accountServiceMock = {
        currentAccount: {
            getValue: () => {}
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ExerciseService,
                HttpClient,
                { provide: AccountService, useValue: accountServiceMock }
            ]
        });

        httpController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpController.verify();
    });

    describe('getExerciseTree', () => {
        let roleSpy: jasmine.Spy<(arg0: Account) => Role>;
        type SubjectCreateType = (
            serverResponse: ServerResponseNode,
            getLocalDone: boolean
        ) => ExerciseTreeNode | null;
        let subjectCreateSpy: jasmine.Spy<SubjectCreateType>;
        let subjectValidSpy: jasmine.Spy<
            (object: any, root?: boolean) => object is ServerResponseNode
        >;
        const subjectId = 'Sb1';
        const expectedBody = {
            subject: subjectId,
            raw: false
        };

        beforeEach(() => {
            roleSpy = spyOn(RoleGuardService, 'getRole');
            subjectCreateSpy = spyOn(Subject, 'createSubject');
            subjectValidSpy = spyOn(Subject, 'checkSubjectValidity');
        });

        it(
            'should throw error on fetching (Type Error)',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient, AccountService],
                    (
                        service: ExerciseService,
                        _: HttpClient,
                        accountService: AccountService
                    ) => {
                        expect(service).toBeTruthy();
                        spyOn(
                            accountService.currentAccount,
                            'getValue'
                        ).and.returnValue(null);
                        subjectValidSpy.and.returnValue(false);

                        service
                            .getExerciseTree(subjectId)
                            .then(() => fail('should throw error'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseList
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush({ name: subjectId });
                    }
                )
            )
        );

        it(
            'should throw error on creating (Type Error)',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient, AccountService],
                    (
                        service: ExerciseService,
                        _: HttpClient,
                        accountService: AccountService
                    ) => {
                        expect(service).toBeTruthy();
                        spyOn(
                            accountService.currentAccount,
                            'getValue'
                        ).and.returnValue(null);
                        subjectCreateSpy.and.returnValue(null);
                        subjectValidSpy.and.returnValue(true);

                        service
                            .getExerciseTree(subjectId)
                            .then(() => fail('should throw error'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseList
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush({});
                    }
                )
            )
        );

        const list: [{ [key: string]: unknown } | null, Role][] = [
            [null, Role.ADMIN],
            [null, Role.USER],
            [{}, Role.ADMIN],
            [{}, Role.TEACHER],
            [{}, Role.USER]
        ];
        for (const [account, role] of list) {
            it(
                `should return Exercise tree (${
                    account ? '' : 'Account null, '
                }${Role[role]} role)`,
                waitForAsync(
                    inject(
                        [ExerciseService, HttpClient, AccountService],
                        (
                            service: ExerciseService,
                            _: HttpClient,
                            accountService: AccountService
                        ) => {
                            expect(service).toBeTruthy();
                            //#region Mocks
                            spyOn(
                                accountService.currentAccount,
                                'getValue'
                            ).and.returnValue(account as unknown as Account);
                            roleSpy.and.returnValue(role);
                            subjectValidSpy.and.returnValue(true);
                            subjectCreateSpy.and.callFake(
                                (object) =>
                                    object as unknown as ExerciseTreeNode
                            );
                            const getDone =
                                role === Role.USER || account === null;
                            const subject = {
                                name: subjectId,
                                children: [
                                    {
                                        name: 'mechanika',
                                        children: [
                                            {
                                                name: 'kinematyka',
                                                children: [
                                                    {
                                                        name: 'Pociągi dwa',
                                                        children: 'pociagi-dwa',
                                                        done: getDone
                                                            ? 0.34
                                                            : undefined
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            };
                            //#endregion

                            service
                                .getExerciseTree(subjectId)
                                .then((response) =>
                                    expect(response).toEqual(
                                        subject as unknown as ExerciseTreeNode
                                    )
                                )
                                .catch(() => fail('should resolve'));
                            const req = httpController.expectOne(
                                ServerRoutes.exerciseList
                            );
                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual(expectedBody);
                            req.flush(subject.children);
                        }
                    )
                )
            );
        }

        for (const getUnassigned of [true, false]) {
            it(
                `should return Exercise tree w/${
                    getUnassigned ? '' : 'o'
                } unassigned`,
                waitForAsync(
                    inject(
                        [ExerciseService, HttpClient, AccountService],
                        (
                            service: ExerciseService,
                            _: HttpClient,
                            accountService: AccountService
                        ) => {
                            expect(service).toBeTruthy();
                            //#region Mocks
                            spyOn(
                                accountService.currentAccount,
                                'getValue'
                            ).and.returnValue(null);
                            roleSpy.and.returnValue(Role.USER);
                            subjectValidSpy.and.returnValue(true);
                            subjectCreateSpy.and.callFake(
                                (object) =>
                                    object as unknown as ExerciseTreeNode
                            );
                            const children = [
                                {
                                    name: 'mechanika',
                                    children: [
                                        {
                                            name: 'kinematyka',
                                            children: [
                                                {
                                                    name: 'Pociągi dwa',
                                                    children: 'pociagi-dwa'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ];
                            const subject = {
                                name: subjectId,
                                children
                            };
                            const unassigned: any[] = [];
                            for (let i = 1; i <= 5; i++) {
                                unassigned.push({
                                    name: `Ex${i}`,
                                    children: `ex${i}`
                                });
                            }
                            const subjectWithUnassigned = {
                                name: subjectId,
                                children: children.concat(unassigned)
                            };
                            //#endregion

                            service
                                .getExerciseTree(subjectId, getUnassigned)
                                .then((response) =>
                                    expect(response).toEqual(
                                        (getUnassigned
                                            ? subjectWithUnassigned
                                            : subject) as any
                                    )
                                )
                                .catch(() => fail('should resolve'));
                            const req = httpController.expectOne(
                                ServerRoutes.exerciseList
                            );
                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual(expectedBody);
                            req.flush(
                                getUnassigned
                                    ? subjectWithUnassigned.children
                                    : subject.children
                            );
                        }
                    )
                )
            );
        }
    });

    describe('getExercise', () => {
        //TODO Tests w/ seed
        const exerciseContent = {
            main: 'Test content',
            img: ['1.png', '2.png'],
            unknown: [
                ['x', '\\mathrm{km}'],
                ['t', '\\mathrm{s}']
            ]
        };
        const subjectId = 'Sb1';
        const exerciseId = 'ex1';
        const expectedBody = {
            subject: subjectId,
            exerciseId,
            seed: undefined
        };

        it(
            'should throw server error',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();
                        const errorCode = 500;

                        service
                            .getExercise(subjectId, exerciseId)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(errorCode)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush('Server error', { status: errorCode, statusText: 'Error' });
                    }
                )
            )
        );

        it(
            'should throw TypeError',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();

                        service
                            .getExercise(subjectId, exerciseId)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush({ type: 'EqEx', name: 'Ex2' });
                    }
                )
            )
        );

        it(
            'should return Exercise',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();
                        const exercise: Exercise = {
                            id: exerciseId,
                            subjectId,
                            type: 'EqEx',
                            name: 'Ex1',
                            problem: exerciseContent,
                            done: 0.14
                        };

                        service
                            .getExercise(subjectId, exerciseId)
                            .then((response) =>
                                expect(response).toEqual(exercise)
                            )
                            .catch(() => fail('should resolve'));
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush(exercise);
                    }
                )
            )
        );

        it(
            'should return Exercise (w/ done from local storage)',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();
                        const type = 'EqEx';
                        const name = 'Ex1';
                        const done = 0.14;
                        spyOn(
                            Object.getPrototypeOf(localStorage),
                            'getItem'
                        ).and.returnValue(done.toString());

                        service
                            .getExercise(subjectId, exerciseId)
                            .then((response) =>
                                expect(response).toEqual({
                                    id: exerciseId,
                                    subjectId,
                                    type,
                                    name,
                                    problem: exerciseContent,
                                    done
                                })
                            )
                            .catch(() => fail('should resolve'));
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush({
                            id: exerciseId,
                            subjectId,
                            type,
                            name,
                            problem: exerciseContent
                        });
                    }
                )
            )
        );
    });

    describe('submitAnswers', () => {
        const answers: number[] = [0.14, 0.5, 1];
        const typeChecker = (
            obj: any,
            arg1: boolean,
            arg2: boolean
        ): obj is number[] => arg1 || arg2;
        const subjectId = 'Sb1';
        const exerciseId = 'ex1';
        function getPromise<T>(
            service: ExerciseService,
            typeCheck: (obj: any, ...args: any[]) => obj is T,
            ...typeCheckArgs: any[]
        ) {
            return service.submitAnswers(
                subjectId,
                exerciseId,
                { answers },
                typeCheck,
                ...typeCheckArgs
            );
        }
        const expectedBody = {
            subject: subjectId,
            exerciseId,
            answer: {
                answers
            }
        };
        const serverResponse = { info: answers };

        it(
            'should throw error',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();
                        const errorCode = 404;

                        getPromise(service, typeChecker, false, true)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(errorCode)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseCheck
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush('Not found', { status: errorCode, statusText: 'Error' });
                    }
                )
            )
        );

        it(
            'should throw Type Error (wrong response)',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();

                        getPromise(service, typeChecker, false, true)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseCheck
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush(answers);
                    }
                )
            )
        );

        it(
            'should throw Type Error (type checker failure)',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();

                        getPromise(service, typeChecker, false, false)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseCheck
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush(serverResponse);
                    }
                )
            )
        );

        it(
            'should return result (multi-arg type checker)',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();

                        getPromise(service, typeChecker, false, true)
                            .then((response) => expect(response).toBe(answers))
                            .catch(() => fail('should be resolved'));
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseCheck
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush(serverResponse);
                    }
                )
            )
        );

        it(
            'should return result (EqEx)',
            waitForAsync(
                inject(
                    [ExerciseService, HttpClient],
                    (service: ExerciseService) => {
                        expect(service).toBeTruthy();
                        const result = answers.map((_, i) => i % 2 === 0);

                        getPromise(service, EqEx.isEqExAnswer, answers.length)
                            .then((response) =>
                                expect(response).toEqual(result)
                            )
                            .catch(() => fail('should be resolved'));
                        const req = httpController.expectOne(
                            ServerRoutes.exerciseCheck
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush({ info: result });
                    }
                )
            )
        );
    });
});
