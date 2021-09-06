/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { HttpClient } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
    Subject,
    SubjectService,
    ViewExerciseTreeNode
} from './subject.service';
import * as ServerRoutes from 'src/app/server-routes';
import { TYPE_ERROR } from 'src/app/helper/utils';
import {
    ExerciseTreeNode,
    Subject as TreeSubject
} from 'src/app/exercise-service/exercise.utils';

describe('Service: Subject', () => {
    let httpController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [SubjectService, HttpClient]
        });

        httpController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpController.verify();
    });

    describe('Subject', () => {
        describe('isPrivate', () => {
            it('should be public Subject', () => {
                const sb = new Subject('Sb1');
                expect(sb.isPrivate).toBeFalse();
            });

            it('should be private Subject', () => {
                const sb = new Subject('_Sb1');
                expect(sb.isPrivate).toBeTrue();
            });
        });

        describe('getName', () => {
            it('should get name of public Subject', () => {
                const sb = new Subject('Sb1');
                expect(sb.getName()).toBe('Sb1');
            });

            it('should get name of private Subject', () => {
                const sb = new Subject('_Sb1');
                expect(sb.getName()).toBe('Sb1');
            });
        });

        describe('static', () => {
            describe('checkIfPrivate', () => {
                it('should be public Subject', () => {
                    expect(Subject.checkIfPrivate('Sb1')).toBeFalse();
                });

                it('should be private Subject', () => {
                    expect(Subject.checkIfPrivate('_Sb1')).toBeTrue();
                });
            });

            describe('getSubjectName', () => {
                it('should get name of public Subject', () => {
                    expect(Subject.getSubjectName('Sb1')).toBe('Sb1');
                });

                it('should get name of private Subject', () => {
                    expect(Subject.getSubjectName('_Sb1')).toBe('Sb1');
                });
            });
        });
    });

    describe('getSubjects', () => {
        const list: [string, number, any][] = [
            ['server error', 500, {}],
            [
                'Type error - not a proper object',
                TYPE_ERROR,
                'I am a trash response :P'
            ],
            [
                'Type error - `subjects` is not an array',
                TYPE_ERROR,
                { subjects: 'I am a trash response :P' }
            ],
            [
                'Type error - mixed type array',
                TYPE_ERROR,
                { subjects: ['abc', 123, false] }
            ]
        ];
        for (const [testMess, errorCode, serverResponse] of list) {
            it(
                `should throw error (${testMess})`,
                waitForAsync(
                    inject(
                        [SubjectService, HttpClient],
                        (service: SubjectService) => {
                            expect(service).toBeTruthy();

                            service
                                .getSubjects()
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(errorCode)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.subjectList
                            );
                            expect(req.request.method).toEqual('GET');
                            if (errorCode === 500) {
                                req.error(new ErrorEvent('Server error'), {
                                    status: errorCode
                                });
                            }
                            else req.flush(serverResponse);
                        }
                    )
                )
            );
        }

        it(
            'should return sorted Subject list',
            waitForAsync(
                inject(
                    [SubjectService, HttpClient],
                    (service: SubjectService) => {
                        expect(service).toBeTruthy();
                        const resultList = [
                            'Sb2',
                            '_Sb2',
                            'Sb1',
                            'Sb4',
                            '_Sb3',
                            'Sb3'
                        ];
                        const expectedList = [
                            'Sb1',
                            'Sb2',
                            '_Sb2',
                            'Sb3',
                            '_Sb3',
                            'Sb4'
                        ];

                        service
                            .getSubjects()
                            .then((subjects) => {
                                expect(subjects.length).toBe(
                                    expectedList.length
                                );
                                const ids = subjects.map(
                                    (subject) => subject.id
                                );
                                for (let i = 0; i < expectedList.length; i++)
                                    expect(ids[i]).toBe(expectedList[i]);
                            })
                            .catch(() => fail('should resolve'));
                        const req = httpController.expectOne(
                            ServerRoutes.subjectList
                        );
                        expect(req.request.method).toEqual('GET');
                        req.flush({ subjects: resultList });
                    }
                )
            )
        );
    });

    describe('getExerciseTree', () => {
        const subjectId = 'Sb1';
        const expectedBody = {
            subject: subjectId,
            raw: false
        };
        it(
            'should throw server error',
            waitForAsync(
                inject(
                    [SubjectService, HttpClient],
                    (service: SubjectService) => {
                        expect(service).toBeTruthy();
                        const errorCode = 500;

                        service
                            .getExerciseTree(subjectId)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(errorCode)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.hierarchyGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.error(new ErrorEvent('Server error'), {
                            status: errorCode
                        });
                    }
                )
            )
        );

        it(
            'should throw Type error (invalid Subject)',
            waitForAsync(
                inject(
                    [SubjectService, HttpClient],
                    (service: SubjectService) => {
                        expect(service).toBeTruthy();
                        spyOn(
                            TreeSubject,
                            'checkSubjectValidity'
                        ).and.returnValue(false);

                        service
                            .getExerciseTree(subjectId)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.hierarchyGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush({ name: 'Mock result' });
                    }
                )
            )
        );

        it(
            'should throw Type error (tree creation failure)',
            waitForAsync(
                inject(
                    [SubjectService, HttpClient],
                    (service: SubjectService) => {
                        expect(service).toBeTruthy();
                        spyOn(
                            TreeSubject,
                            'checkSubjectValidity'
                        ).and.returnValue(true);
                        spyOn(TreeSubject, 'createSubject').and.returnValue(
                            null
                        );

                        service
                            .getExerciseTree(subjectId)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.hierarchyGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush({ name: 'Mock result' });
                    }
                )
            )
        );

        it(
            'should return Exercise tree',
            waitForAsync(
                inject(
                    [SubjectService, HttpClient],
                    (service: SubjectService) => {
                        expect(service).toBeTruthy();
                        const result = new ExerciseTreeNode('mock', null);
                        spyOn(
                            TreeSubject,
                            'checkSubjectValidity'
                        ).and.returnValue(true);
                        spyOn(TreeSubject, 'createSubject').and.returnValue(
                            result
                        );

                        service
                            .getExerciseTree(subjectId)
                            .then((response) =>
                                expect(response).toEqual(
                                    new ViewExerciseTreeNode(result as any)
                                )
                            )
                            .catch(() => fail('should be resolved'));
                        const req = httpController.expectOne(
                            ServerRoutes.hierarchyGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush(result);
                    }
                )
            )
        );
    });
});
