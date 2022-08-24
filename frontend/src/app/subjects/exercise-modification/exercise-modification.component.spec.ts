import { Component } from '@angular/core';
import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Params as ParamMap } from 'src/app/helper/tests/tests.utils';

import { ExerciseModificationComponent } from './modification/modification.component';
import { ExerciseModificationService } from './service/exercise-modification.service';

@Component({
    selector: 'app-exercise-form',
    template: ''
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ExerciseModificationFormComponentMock {
    submit(_nextRoute: string | undefined) {}

    isModified() {
        return true;
    }
}

export class Params extends ParamMap {
    constructor(subjectId: string, exerciseId: string) {
        super([
            ['subjectId', subjectId],
            ['exerciseId', exerciseId]
        ]);
    }

    /* subscribe: (next: (params: Map<string, string>) => void) => Subscription = (
        next
    ) => {
        setTimeout(() => {
            const map = new Map<string, string>();
            map.set('subjectId', this.subjectId);
            map.set('exerciseId', this.exerciseId);
            next(map);
        }, 20);
        return new Subscription();
    }; */
}

describe('ExerciseModComponent', () => {
    let component: ExerciseModificationComponent;
    let fixture: ComponentFixture<ExerciseModificationComponent>;
    const exerciseMock = {
        subjectId: 'sb1',
        id: 'ex1'
    };
    const exerciseServiceMock = {
        getExercise: (_subjectId: string, _exerciseId: string) =>
            Promise.reject({})
    };
    const routerMock = {
        navigate: (_: any[]) => Promise.resolve(true),
        navigateByUrl: (_: string) => Promise.resolve(true)
    };
    const routeMock = {
        paramMap: new Params(exerciseMock.subjectId, exerciseMock.id)
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                ExerciseModificationComponent,
                ExerciseModificationFormComponentMock
            ],
            providers: [
                {
                    provide: ExerciseModificationService,
                    useValue: exerciseServiceMock
                },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: routeMock }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ExerciseModificationComponent);
        component = fixture.componentInstance;
        component.isLoading = false;
        component.exercise = exerciseMock as any;
        component.exerciseId = exerciseMock.id;
        component.subjectId = exerciseMock.subjectId;
        fixture.detectChanges();
    });

    it('should create', inject(
        [ExerciseModificationService, Router, ActivatedRoute],
        () => {
            expect(component).toBeTruthy();
            expect(getFormComponent()).toBeDefined();
        }
    ));

    describe('isModified', () => {
        it('should return modified state', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                const spy = spyOn(getFormComponent(), 'isModified');
                for (const isModified of [false, true]) {
                    spy.and.returnValue(isModified);
                    expect(component)
                        .withContext(getContext(isModified))
                        .toBeTruthy();

                    expect(component.isModified())
                        .withContext(getContext(isModified))
                        .toBe(isModified);
                }
            }
        ));

        it('should return default', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                setFormComponentAsUndefined();
                expect(component).toBeTruthy();

                expect(component.isModified()).toBeTrue();
            }
        ));

        function getContext(isModified: boolean): string {
            return `isModified ${isModified}`;
        }
    });

    describe('onSuccess', () => {
        let flagSpy: jasmine.Spy;

        beforeEach(() => {
            flagSpy = spyOn(
                component as any,
                'setSubmitFlag'
            ).and.callThrough();
        });

        it('should navigate to Subject dashboard', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            (_: ExerciseModificationService, router: Router) => {
                const navSpy = spyOn(router, 'navigate');
                expect(component).toBeTruthy();

                component.onSuccess();
                expect(flagSpy).toHaveBeenCalledWith();
                expect(navSpy).toHaveBeenCalledWith([
                    '/subject/dashboard',
                    exerciseMock.subjectId
                ]);
            }
        ));

        it('should navigate to route', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            (_: ExerciseModificationService, router: Router) => {
                const route = '/test/route';
                const navUrlSpy = spyOn(router, 'navigateByUrl');
                expect(component).toBeTruthy();

                component.onSuccess(route);
                expect(flagSpy).toHaveBeenCalledWith();
                expect(navUrlSpy).toHaveBeenCalledWith(route);
            }
        ));

        it('should do nothing', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            (_: ExerciseModificationService, router: Router) => {
                const navSpy = spyOn(router, 'navigate');
                const navUrlSpy = spyOn(router, 'navigateByUrl');
                component.subjectId = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onSuccess();
                expect(flagSpy).not.toHaveBeenCalled();
                expect(navSpy).not.toHaveBeenCalled();
                expect(navUrlSpy).not.toHaveBeenCalled();
            }
        ));
    });

    describe('onCancel', () => {
        let exitSpy: jasmine.Spy;
        let routerSpy: jasmine.Spy;

        beforeEach(() => {
            const router = TestBed.inject(Router);
            exitSpy = spyOn(component as any, 'confirmExit');
            routerSpy = spyOn(router, 'navigate');
        });

        it('should navigate to Subject dashboard', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                expect(component).toBeTruthy();

                component.onCancel();
                expect(exitSpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith([
                    '/subject/dashboard',
                    exerciseMock.subjectId
                ]);
            }
        ));

        it('should do nothing', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                component.subjectId = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onCancel();
                expect(exitSpy).not.toHaveBeenCalled();
                expect(routerSpy).not.toHaveBeenCalled();
            }
        ));
    });

    describe('onExitSubmit', () => {
        it('should close modal & submit', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                //#region Mocks & setup
                const formSpy = spyOn(getFormComponent(), 'submit');
                const navSpy = spyOn(component, 'resetNavigation');
                const mockState = 'Mock state';
                component.nextState = mockState;
                component.isConfirmExitModalOpen = true;
                fixture.detectChanges();
                //#endregion
                expect(component).toBeTruthy();

                component.onExitSubmit();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(formSpy).toHaveBeenCalledWith(mockState);
                expect(navSpy).toHaveBeenCalledWith();
            }
        ));

        it('should close modal', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                //#region Mocks & setup
                setFormComponentAsUndefined();
                const navSpy = spyOn(component, 'resetNavigation');
                component.isConfirmExitModalOpen = true;
                fixture.detectChanges();
                //#endregion
                expect(component).toBeTruthy();

                component.onExitSubmit();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(navSpy).toHaveBeenCalledWith();
            }
        ));
    });

    describe('onExitDiscard', () => {
        let exitSpy: jasmine.Spy;
        let routerSpy: jasmine.Spy;
        let cancelSpy: jasmine.Spy;

        beforeEach(() => {
            const router = TestBed.inject(Router);
            exitSpy = spyOn(component as any, 'confirmExit');
            routerSpy = spyOn(router, 'navigateByUrl');
            cancelSpy = spyOn(component, 'onCancel');

            component.isConfirmExitModalOpen = true;
            fixture.detectChanges();
        });

        it('should navigate to Subject dashboard', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                const route = '/test/route';
                component.nextState = route;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onExitDiscard();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(exitSpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith(route);
                expect(cancelSpy).not.toHaveBeenCalled();
            }
        ));

        it('should cancel', inject(
            [ExerciseModificationService, Router, ActivatedRoute],
            () => {
                expect(component).toBeTruthy();

                component.onExitDiscard();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(exitSpy).not.toHaveBeenCalled();
                expect(routerSpy).not.toHaveBeenCalled();
                expect(cancelSpy).toHaveBeenCalledWith();
            }
        ));
    });

    function getFormComponent(): ExerciseModificationFormComponentMock {
        return (component as any).formComponent;
    }

    function setFormComponentAsUndefined() {
        (component as any).formComponent = undefined;
    }
});
