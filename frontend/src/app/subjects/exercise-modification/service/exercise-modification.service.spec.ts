/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { HttpClient } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
    Exercise as RenderedExercise,
    PreviewExercise
} from 'src/app/exercise-service/exercises';
import { TYPE_ERROR } from 'src/app/helper/utils';
import { ExerciseModificationService as ModificationService } from './exercise-modification.service';
import * as ServerRoutes from 'src/app/server-routes';
import { Exercise, ExerciseHeader } from './exercise-modification.utils';

describe('Service: ExerciseModification', () => {
    let httpController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ModificationService, HttpClient]
        });

        httpController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpController.verify();
    });

    describe('getAllExercises', () => {
        const subjectId = 'Sb1';
        const expectedBody = { subject: subjectId };

        const list: [string, number, any][] = [
            ['server error', 500, {}],
            ['Not Found error', 404, {}],
            ['Type error', TYPE_ERROR, [{ name: 'Trash :P' }]]
        ];
        for (const [testMess, errorCode, serverResponse] of list) {
            it(
                `should throw ${testMess}`,
                waitForAsync(
                    inject(
                        [ModificationService, HttpClient],
                        (service: ModificationService) => {
                            expect(service).toBeTruthy();

                            service
                                .getAllExercises(subjectId)
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(errorCode)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.subjectExerciseList
                            );
                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual(expectedBody);
                            if (errorCode !== TYPE_ERROR) {
                                req.error(new ErrorEvent(testMess), {
                                    status: errorCode
                                });
                            }
                            else req.flush(serverResponse);
                        }
                    )
                )
            );
        }

        it('should return Set of all Exercise ids', inject(
            [ModificationService, HttpClient],
            (service: ModificationService) => {
                expect(service).toBeTruthy();
                //#region Mock objects
                const exercises = ['pociagi-dwa', 'kat', 'atom', 'spotkanie'];
                const resultSet = new Set(exercises);
                const serverResponse = {
                    exercises: exercises.map((id) => ({
                        id,
                        type: 'EqEx',
                        name: id.toUpperCase(),
                        description: 'Test description'
                    }))
                };
                //#endregion

                service
                    .getAllExercises(subjectId)
                    .then((response) => expect(response).toEqual(resultSet))
                    .catch(() => fail('should be resolved'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectExerciseList
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual(expectedBody);
                req.flush(serverResponse);
            }
        ));
    });

    describe('getExercise', () => {
        const exerciseId = 'ex1';
        const subjectId = 'Sb1';
        const expectedBody = {
            subject: subjectId,
            exerciseId
        };

        const list: [string, number, any][] = [
            ['server error', 500, {}],
            [
                'Type error (wrong server response)',
                TYPE_ERROR,
                { content: 123 }
            ],
            [
                'Type error (Exercise instance creation)',
                TYPE_ERROR,
                { content: 'abc' }
            ]
        ];
        for (const [testMess, errorCode, serverResponse] of list) {
            it(
                `should throw ${testMess}`,
                waitForAsync(
                    inject(
                        [ModificationService, HttpClient],
                        (service: ModificationService) => {
                            expect(service).toBeTruthy();

                            service
                                .getExercise(subjectId, exerciseId)
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(errorCode)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.subjectExerciseGet
                            );
                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual(expectedBody);
                            if (errorCode !== TYPE_ERROR) {
                                req.error(new ErrorEvent(testMess), {
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
            'should return Exercise',
            waitForAsync(
                inject(
                    [ModificationService, HttpClient],
                    (service: ModificationService) => {
                        expect(service).toBeTruthy();
                        const content =
                            'Z miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n';
                        const serverResponse = {
                            content: `---\ntype: EqEx\nname: Pociągi dwa\n---\n${content}`
                        };

                        service
                            .getExercise(subjectId, exerciseId)
                            .then((response) => {
                                expect(response).toBeInstanceOf(Exercise);
                                expect(response.header.type).toBe('EqEx');
                                expect(response.header.name).toBe(
                                    'Pociągi dwa'
                                );
                                expect(response.content).toBe(content);
                            })
                            .catch(() => fail('should be resolved'));
                        const req = httpController.expectOne(
                            ServerRoutes.subjectExerciseGet
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(expectedBody);
                        req.flush(serverResponse);
                    }
                )
            )
        );
    });

    describe('addExercise', () => {
        expectSendExerciseRequest(
            ServerRoutes.subjectExerciseAdd,
            'ex1',
            'Ex1',
            [['throw error (id already exists)', 409]]
        );
    });

    describe('updateExercise', () => {
        expectSendExerciseRequest(
            ServerRoutes.subjectExerciseUpdate,
            'ex2',
            'Ex2',
            [['throw error (not found)', 404]]
        );
    });

    describe('getExercisePreview', () => {
        //TODO Tests w/ images
        const exercise = new Exercise(
            new ExerciseHeader('EqEx', 'Ex1'),
            'Test content'
        );
        const stringifiedExercise = {
            content: getToStringResult(
                `type: ${exercise.header.type}\nname: ${exercise.header.name}\n`,
                exercise.content
            ),
            seed: undefined
        };

        //TODO Tests w/ seed
        it(
            'should throw server error',
            waitForAsync(
                inject(
                    [ModificationService, HttpClient],
                    (service: ModificationService) => {
                        expect(service).toBeTruthy();
                        const errorCode = 500;

                        service
                            .getExercisePreview(exercise)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(errorCode)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.subjectExercisePreview
                        );
                        expect(req.request.method).toEqual('POST');
                        req.error(new ErrorEvent('Server error'), {
                            status: errorCode
                        });
                    }
                )
            )
        );

        it(
            'should throw Type error (not an Exercise)',
            waitForAsync(
                inject(
                    [ModificationService, HttpClient],
                    (service: ModificationService) => {
                        expect(service).toBeTruthy();

                        service
                            .getExercisePreview(exercise)
                            .then(() => fail('should be rejected'))
                            .catch((error) =>
                                expect(error.status).toBe(TYPE_ERROR)
                            );
                        const req = httpController.expectOne(
                            ServerRoutes.subjectExercisePreview
                        );
                        expect(req.request.method).toEqual('POST');
                        expect(req.request.body).toEqual(stringifiedExercise);
                        req.flush({ abc: 'I am trash :P' });
                    }
                )
            )
        );

        it('should throw Type error (not a PreviewExercise)', inject(
            [ModificationService, HttpClient],
            (service: ModificationService) => {
                expect(service).toBeTruthy();
                const result: RenderedExercise = {
                    id: '',
                    subjectId: '',
                    type: 'EqEx',
                    name: 'Ex1',
                    problem: {}
                };

                service
                    .getExercisePreview(exercise)
                    .then(() => fail('should be rejected'))
                    .catch((error) => expect(error.status).toBe(TYPE_ERROR));
                const req = httpController.expectOne(
                    ServerRoutes.subjectExercisePreview
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual(stringifiedExercise);
                req.flush(result);
            }
        ));

        it('should return preview', inject(
            [ModificationService, HttpClient],
            (service: ModificationService) => {
                expect(service).toBeTruthy();
                const result: PreviewExercise = {
                    id: '',
                    subjectId: '',
                    type: 'EqEx',
                    name: 'Ex1',
                    problem: {},
                    correctAnswer: {}
                };

                service
                    .getExercisePreview(exercise)
                    .then((response) => expect(response).toEqual(result))
                    .catch(() => fail('should resolve'));
                const req = httpController.expectOne(
                    ServerRoutes.subjectExercisePreview
                );
                expect(req.request.method).toEqual('POST');
                expect(req.request.body).toEqual(stringifiedExercise);
                req.flush(result);
            }
        ));
    });

    function expectSendExerciseRequest(
        url: string,
        id: string,
        name: string,
        specialCases: [string, number | null][]
    ) {
        const exercise = new Exercise(
            new ExerciseHeader('EqEx', name),
            'Test content\n'
        );
        const subjectId = 'Sb1';
        const result = `---\ntype: EqEx\nname: ${name}\n---\nTest content\n`;
        const expectedBody = {
            subject: subjectId,
            exerciseId: id,
            content: result
        };

        const list: [string, number | null][] = [
            ['resolve', null],
            ['throw server error', 500]
        ];
        for (const [testMess, errorCode] of list.concat(specialCases)) {
            it(
                `should ${testMess}`,
                waitForAsync(
                    inject(
                        [ModificationService, HttpClient],
                        (service: ModificationService) => {
                            expect(service).toBeTruthy();

                            const promise =
                                url === ServerRoutes.subjectExerciseAdd
                                    ? service.addExercise(subjectId, exercise)
                                    : service.updateExercise(
                                          subjectId,
                                          id,
                                          exercise
                                      );
                            promise
                                .then(() => {
                                    if (errorCode !== null)
                                        fail('should be rejected');
                                })
                                .catch((error) => {
                                    if (errorCode !== null)
                                        expect(error.status).toBe(errorCode);
                                    else fail('should resolve');
                                });
                            const req = httpController.expectOne(url);
                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual(expectedBody);
                            if (errorCode === null) req.flush({});
                            else {
                                req.error(new ErrorEvent(testMess), {
                                    status: errorCode
                                });
                            }
                        }
                    )
                )
            );
        }
    }
});

export function getToStringResult(header: string, content: string) {
    return `---\n${header}---\n${content}`;
}
