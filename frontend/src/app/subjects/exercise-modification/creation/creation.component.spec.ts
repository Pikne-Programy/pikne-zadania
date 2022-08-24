/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { setAsyncTimeout } from 'src/app/helper/tests/tests.utils';
import { ExerciseModificationFormComponentMock, Params } from '../exercise-modification.component.spec';
import { ExerciseModificationService } from '../service/exercise-modification.service';

import { ExerciseCreationComponent } from './creation.component';

describe('ExerciseCreationComponent', () => {
    let component: ExerciseCreationComponent;
    let fixture: ComponentFixture<ExerciseCreationComponent>;
    const exerciseData = {
        subjectId: 'sb1',
        id: 'ex1'
    };
    const exerciseServiceMock = {
        getAllExercises: (_: string) =>
            Promise.resolve(new Set())
    };
    const routerMock = {
        navigate: (_: any[]) => Promise.resolve(true),
        navigateByUrl: (_: string) => Promise.resolve(true)
    };
    const routeMock = {
        paramMap: new Params(exerciseData.subjectId, exerciseData.id)
    };

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ExerciseCreationComponent,
                    ExerciseModificationFormComponentMock],
                providers: [
                    {
                        provide: ExerciseModificationService,
                        useValue: exerciseServiceMock
                    },
                    { provide: Router, useValue: routerMock },
                    { provide: ActivatedRoute, useValue: routeMock }
                ]
            }).compileComponents();
        })
    );

    function setupTest() {
        fixture = TestBed.createComponent(ExerciseCreationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('should create', inject(
        [ExerciseModificationService, Router, ActivatedRoute],
        async () => {
            setupTest();

            expect(component).toBeTruthy();
            expect(component.isLoading).toBeTrue();

            await setAsyncTimeout(50);
            expect(component.subjectId).toBe(exerciseData.subjectId);
            expect(component.exercise).toBeDefined();
            expect(component.exerciseSet).toBeDefined();
            expect(component.exerciseSet).not.toBeNull();
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/ error', inject(
        [ExerciseModificationService, Router, ActivatedRoute],
        async (exerciseService: ExerciseModificationService) => {
            const errorCode = 500;
            spyOn(exerciseService, 'getAllExercises').and.rejectWith({
                status: errorCode
            });
            setupTest();

            expect(component).toBeTruthy();
            expect(component.isLoading).toBeTrue();

            await setAsyncTimeout(50);
            expect(component.subjectId).toBe(exerciseData.subjectId);
            expect(component.exercise).toBeDefined();
            expect(component.errorCode).toBe(errorCode);
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/o Subscription', inject(
        [ExerciseModificationService, Router, ActivatedRoute],
        () => {
            spyOn(routeMock.paramMap, 'subscribe').and.callFake((next) => {
                const map = new Map<string, string>();
                map.set('subjectId', exerciseData.subjectId);
                next(map);
                return undefined as any;
            });
            setupTest();

            expect(component).toBeTruthy();
        }
    ));

    describe('getError', () => {
        beforeEach(async () => {
            setupTest();
            await setAsyncTimeout(50);
        });

        it('should return null (isLoading)', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                component.isLoading = true;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                expect(component.errorCode).toBeNull();
            }
        ));

        it('should return SubjectError', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                component.subjectId = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                expect(component.errorCode).toBe(
                    (component as any).SubjectError
                );
            }
        ));

        it('should return error as normal', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                for (const errorCode of [null, 401, 404, 500]) {
                    (component as any)._errorCode = errorCode;
                    fixture.detectChanges();
                    expect(component)
                        .withContext(`Code: ${errorCode}`)
                        .toBeTruthy();

                    expect(component.errorCode)
                        .withContext(`Code: ${errorCode}`)
                        .toBe(errorCode);
                }
            }
        ));
    });

    describe('getErrorMessage', () => {
        beforeEach(() => {
            setupTest();
        });

        it('should return default', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                expect(component).toBeTruthy();

                for (const errorCode of [401, 403, 404, 500]) {
                    expect(component.getErrorMessage(errorCode))
                        .withContext(`Code: ${errorCode}`)
                        .toBeUndefined();
                }
            }
        ));
    });
});
