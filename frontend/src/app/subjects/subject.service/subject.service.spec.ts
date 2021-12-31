/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { HttpClient } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
    Assignee,
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
import { AssigneeUser } from 'src/app/user/team.service/types';

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

    describe('addSubject', () => {
        //#region Mock objects
        const subjectName = 'Sb1';
        const assigneeList: string[] = [];
        for (let i = 1; i <= 5; i++) assigneeList.push(`User${i}Id`);
        //#endregion

        it('should throw error', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();
                const errorCode = 409;

                service
                    .addSubject(subjectName, false, assigneeList)
                    .then(() => fail('should be rejected'))
                    .catch((error) => expect(error.status).toBe(errorCode));
                const req = httpController.expectOne(
                    ServerRoutes.subjectCreate
                );
                expect(req.request.method).toEqual('POST');
                req.error(new ErrorEvent('Id taken'), { status: errorCode });
            }
        ));

        it('should create subject', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();

                service
                    .addSubject(subjectName, false, assigneeList)
                    .then((response) => expect(response).toBe(subjectName))
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectCreate
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({
                    subject: subjectName,
                    assignees: assigneeList
                });
                req.flush({});
            }
        ));

        it('should create private subject', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();
                const privateName = `_${subjectName}`;

                service
                    .addSubject(subjectName, true, assigneeList)
                    .then((response) => expect(response).toBe(privateName))
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectCreate
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({
                    subject: privateName,
                    assignees: assigneeList
                });
                req.flush({});
            }
        ));

        it('should create public subject', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();

                service
                    .addSubject(subjectName, false, [])
                    .then((response) => expect(response).toBe(subjectName))
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectCreate
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({
                    subject: subjectName,
                    assignees: null
                });
                req.flush({});
            }
        ));

        xit('should create admin-only subject', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();

                service
                    //TODO Add logic for admin-only subjects
                    .addSubject(subjectName, false, assigneeList)
                    .then((response) => expect(response).toBe(subjectName))
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectCreate
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({
                    subject: subjectName,
                    assignees: []
                });
                req.flush({});
            }
        ));
    });

    describe('getAssignees', () => {
        const subjectId = 'Sb1';
        const teacherList: AssigneeUser[] = [];
        const serverError = 500;

        const list: [number, string, any][] = [
            [serverError, 'server error', undefined],
            [TYPE_ERROR, `Type error (no 'assignees' field)`, {}],
            [
                TYPE_ERROR,
                `Type error (wrong 'assignees' type)`,
                {
                    assignees: [{ userId: 'abc', name: 'ABC' }, {}]
                }
            ]
        ];
        for (const [errorCode, testMess, returnObj] of list) {
            it(`should throw ${testMess}`, inject(
                [SubjectService, HttpClient],
                (service: SubjectService) => {
                    expect(service).toBeTruthy();

                    service
                        .getAssignees(subjectId, teacherList)
                        .then(() => fail('should be rejected'))
                        .catch((error) => expect(error.status).toBe(errorCode));
                    const req = httpController.expectOne(
                        ServerRoutes.subjectInfo
                    );
                    expect(req.request.method).toEqual('POST');
                    expect(req.request.body).toEqual({ subject: subjectId });
                    if (errorCode === serverError) {
                        req.error(new ErrorEvent('Server error'), {
                            status: errorCode
                        });
                    }
                    else req.flush(returnObj);
                }
            ));
        }

        it('should return ALL_ASSIGNEES_SELECTED code', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();

                service
                    .getAssignees(subjectId, teacherList)
                    .then(() => fail('should return error'))
                    .catch((error) =>
                        expect(error.status).toBe(
                            SubjectService.ALL_ASSIGNEES_SELECTED
                        )
                    );
                const req = httpController.expectOne(ServerRoutes.subjectInfo);
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({ subject: subjectId });
                req.flush({ assignees: null });
            }
        ));

        it('should return list of assignees', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();
                const teachers = [];
                for (let i = 5; i > 0; i--) {
                    teachers.push({
                        userId: `user${i}`,
                        name: `User${i}`,
                        number: 6 - i
                    });
                }
                const assignees = [];
                for (let i = 1; i <= 5; i += 2) {
                    assignees.push({
                        userId: `user${i}`,
                        name: `User${i}`
                    });
                }
                const result: Assignee[] = [];
                for (let i = 1; i <= 5; i++) {
                    result.push({
                        userId: `user${i}`,
                        name: `User${i}`,
                        isSelected: i % 2 !== 0
                    });
                }

                service
                    .getAssignees(subjectId, teachers)
                    .then((response) => expect(response).toEqual(result))
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(ServerRoutes.subjectInfo);
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({ subject: subjectId });
                req.flush({ assignees });
            }
        ));
    });

    describe('setAssignees', () => {
        const subjectId = 'Sb1';

        it('should throw error', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();
                const errorCode = 500;
                const assignees: Assignee[] = [];

                service
                    .setAssignees(subjectId, assignees)
                    .then(() => fail('should be rejected'))
                    .catch((error) => expect(error.status).toBe(errorCode));
                const req = httpController.expectOne(
                    ServerRoutes.subjectPermit
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({
                    subject: subjectId,
                    assignees
                });
                req.error(new ErrorEvent('Server error'), {
                    status: errorCode
                });
            }
        ));

        it('should set selected assignees', inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();
                const assignees = [];
                for (let i = 1; i <= 5; i++) {
                    assignees.push({
                        userId: `user${i}`,
                        name: `User${i}`,
                        isSelected: i % 2 !== 0
                    });
                }
                const selectedAssignees = [];
                for (const user of assignees)
                    if (user.isSelected) selectedAssignees.push(user.userId);

                service
                    .setAssignees(subjectId, assignees)
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectPermit
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({
                    subject: subjectId,
                    assignees: selectedAssignees
                });
                req.flush({});
            }
        ));

        it(`should set 'All Assignees Selected'`, inject(
            [SubjectService, HttpClient],
            (service: SubjectService) => {
                expect(service).toBeTruthy();

                service
                    .setAssignees(subjectId, null)
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectPermit
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual({
                    subject: subjectId,
                    assignees: null
                });
                req.flush({});
            }
        ));
    });
});
