import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { setAsyncTimeout } from 'src/app/helper/tests/tests.utils';

import {
    SubjectDashboardPreviewComponent as PreviewComponent,
    ViewExercise
} from './preview.component';

describe('SubjectDashboardPreviewComponent', () => {
    let component: PreviewComponent;
    let fixture: ComponentFixture<PreviewComponent>;
    const subjectId = 'sb1';
    let exercise: ViewExercise;
    const routerMock = {
        navigate: (_: any[]) => Promise.resolve(true)
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PreviewComponent],
            providers: [{ provide: Router, useValue: routerMock }]
        }).compileComponents();
    }));

    function setupTest(exerciseType: string, isLast: boolean = true) {
        exercise = {
            type: exerciseType as any,
            id: 'ex1',
            name: 'Exercise 1'
        };
        fixture = TestBed.createComponent(PreviewComponent);
        component = fixture.componentInstance;
        component.exercise = exercise;
        component.subjectId = subjectId;
        component.isLast = isLast;
        fixture.detectChanges();
    }

    it('should create', async () => {
        setupTest('', false);
        const readySpy = spyOn(component.ready, 'emit');
        expect(component).toBeTruthy();

        await setAsyncTimeout(100);
        expect(readySpy).not.toHaveBeenCalled();
    });

    it('should create last (EqEx)', async () => {
        setupTest('EqEx');
        const mathSpy = spyOn(component, 'setMath').and.resolveTo();
        const readySpy = spyOn(component.ready, 'emit');
        fixture.detectChanges();
        expect(component).toBeTruthy();

        await setAsyncTimeout(100);
        expect(mathSpy).toHaveBeenCalledWith();
        expect(readySpy).toHaveBeenCalledWith();
    });

    it('should create last (default)', async () => {
        setupTest('garbage');
        const readySpy = spyOn(component.ready, 'emit');
        fixture.detectChanges();
        expect(component).toBeTruthy();

        await setAsyncTimeout(100);
        expect(readySpy).toHaveBeenCalledWith();
    });

    describe('getIconTitle', () => {
        const iconList: [string, string][] = [
            ['edit', 'Edytuj zadanie'],
            ['add', 'Dodaj zadanie do testu'],
            ['added', 'Dodano zadanie do testu'],
            ['none', '']
        ];

        beforeEach(() => {
            setupTest('EqEx', false);
        });

        for (const [icon, title] of iconList) {
            it(`should return '${icon}' title`, () => {
                component.icon = icon as any;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                expect(component.getIconTitle()).toBe(title);
            });
        }
    });

    describe('onIconClick', () => {
        beforeEach(() => {
            setupTest('EqEx', false);
        });

        it(`should execute 'edit'`, inject([Router], (router: Router) => {
            const routerSpy = spyOn(router, 'navigate');
            component.icon = 'edit';
            fixture.detectChanges();
            expect(component).toBeTruthy();

            component.onIconClick();
            expect(routerSpy).toHaveBeenCalledWith([
                '/subject/exercise-edit',
                subjectId,
                exercise.id
            ]);
        }));

        for (const icon of ['add', 'added']) {
            it(`should execute '${icon}'`, () => {
                const clickSpy = spyOn(component.itemClick, 'emit');
                component.icon = icon as any;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onIconClick();
                expect(clickSpy).toHaveBeenCalledWith([subjectId, exercise]);
            });
        }

        it(`should execute 'none'`, inject([Router], (router: Router) => {
            const routerSpy = spyOn(router, 'navigate');
            const clickSpy = spyOn(component.itemClick, 'emit');
            component.icon = 'none';
            fixture.detectChanges();
            expect(component).toBeTruthy();

            component.onIconClick();
            expect(routerSpy).not.toHaveBeenCalled();
            expect(clickSpy).not.toHaveBeenCalled();
        }));
    });

    describe('getLineCountClass', () => {
        beforeEach(() => {
            setupTest('EqEx', false);
        });

        it('should return default', () => {
            expect(component).toBeTruthy();

            expect(component.lineCountClass).toBe('lines-2');
        });

        it('should return appropriate class', () => {
            for (let i = 1; i <= 5; i++) {
                component.ellipsisLines = i;
                fixture.detectChanges();
                expect(component).withContext(`Line count: ${i}`).toBeTruthy();

                expect(component.lineCountClass)
                    .withContext(`Line count: ${i}`)
                    .toBe(`lines-${i}`);
            }
        });

        it('should return class from coerced value', () => {
            for (const i of [-10, -1, 0, 6, 7, 10]) {
                component.ellipsisLines = i;
                fixture.detectChanges();
                expect(component).withContext(`Line count: ${i}`).toBeTruthy();

                expect(component.lineCountClass)
                    .withContext(`Line count: ${i}`)
                    .toBe(coerceClass(i));
            }
        });

        function coerceClass(i: number): string {
            if (i < 1) i = 1;
            else if (i > 5) i = 5;
            return `lines-${i}`;
        }
    });

    describe('setMath', () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const MathJax = {
            typesetPromise: () => Promise.resolve()
        };

        beforeEach(() => {
            (window as any).MathJax = MathJax;
            setupTest('EqEx', false);
        });

        it('should typeset math & remove tab indices', async () => {
            const mathSpy = spyOn(MathJax, 'typesetPromise').and.resolveTo();
            const tabIndexSpy = spyOn(component, 'removeMathTabIndex');
            expect(component).toBeTruthy();

            await component.setMath();
            expect(mathSpy).toHaveBeenCalledWith();
            expect(tabIndexSpy).toHaveBeenCalledWith();
        });
    });
});
