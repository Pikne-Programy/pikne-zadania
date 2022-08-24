import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'src/app/exercise-service/exercise.utils';
import { Params, setAsyncTimeout } from 'src/app/helper/tests/tests.utils';
import { TYPE_ERROR } from 'src/app/helper/utils';
import { HierarchyService } from '../hierarchy/service/hierarchy.service';
import {
    SubjectService,
    ViewExerciseTreeNode
} from '../subject.service/subject.service';

import { SubjectDashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
    let component: SubjectDashboardComponent;
    let fixture: ComponentFixture<SubjectDashboardComponent>;
    const subjectId = 'sb1';
    const subjectServiceMock = {
        getExerciseTree: (_id: string, _type: boolean) =>
            Promise.reject({ status: 1 })
    };
    const hierarchyServiceMock = {
        setNewExerciseHierarchy: (_: ViewExerciseTreeNode) => {},
        setNewExerciseHierarchyAsRoot: () => {}
    };
    const routerMock = {
        navigate: (_: any[]) => Promise.resolve(true)
    };
    const routeMock = {
        paramMap: new Params([['subjectId', subjectId]])
    };
    let tree: ViewExerciseTreeNode | null;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SubjectDashboardComponent],
            providers: [
                { provide: SubjectService, useValue: subjectServiceMock },
                { provide: HierarchyService, useValue: hierarchyServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: routeMock }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        tree = createTree(subjectId);
        fixture = TestBed.createComponent(SubjectDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', inject(
        [SubjectService, HierarchyService, Router, ActivatedRoute],
        async (service: SubjectService) => {
            if (!tree) {
                fail('TEST FAILURE - Tree creation error');
                return;
            }
            const subjectServiceSpy = spyOn(
                service,
                'getExerciseTree'
            ).and.resolveTo(tree);
            const exerciseSpy = spyOn(component, 'getCurrentNodeExercises');
            expect(component).toBeTruthy();

            await setAsyncTimeout(50);
            expect(subjectServiceSpy).toHaveBeenCalledWith(subjectId, true);
            expect(tree.isSelected).toBeTrue();
            expect(component.categoryTree).toEqual(tree);
            expect(component.currentNode).toEqual(tree);
            expect(exerciseSpy).toHaveBeenCalledWith();
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/ error', inject(
        [SubjectService, HierarchyService, Router, ActivatedRoute],
        async (service: SubjectService) => {
            const errorCode = 500;
            const subjectServiceSpy = spyOn(
                service,
                'getExerciseTree'
            ).and.rejectWith({ status: errorCode });
            expect(component).toBeTruthy();

            await setAsyncTimeout(50);
            expect(subjectServiceSpy).toHaveBeenCalledWith(subjectId, true);
            expect((component as any)._errorCode).toBe(errorCode);
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/o Subscription', inject(
        [SubjectService, HierarchyService, Router, ActivatedRoute],
        async (
            service: SubjectService,
            _hs: HierarchyService,
            _r: Router,
            route: ActivatedRoute
        ) => {
            //#region Setup test
            spyOn(route.paramMap, 'subscribe').and.callFake((next: any) => {
                const map = new Map<string, string>();
                map.set('subjectId', subjectId);
                next(map);
                return undefined as any;
            });
            const errorCode = 500;
            const subjectServiceSpy = spyOn(
                service,
                'getExerciseTree'
            ).and.rejectWith({ status: errorCode });
            tree = createTree(subjectId);
            fixture = TestBed.createComponent(SubjectDashboardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            //#endregion
            expect(component).toBeTruthy();

            await setAsyncTimeout(50);
            expect(subjectServiceSpy).toHaveBeenCalledWith(subjectId, true);
        }
    ));

    describe('getError', () => {
        it('should return null (isLoading)', inject(
            [SubjectService],
            async (service: SubjectService) => {
                spyOn(service, 'getExerciseTree').and.rejectWith({});
                await setAsyncTimeout(50);
                component.isLoading = true;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                expect(component.errorCode).toBeNull();
            }
        ));

        it('should return SubjectError', inject(
            [SubjectService],
            async (service: SubjectService) => {
                spyOn(service, 'getExerciseTree').and.rejectWith({});
                await setAsyncTimeout(50);
                component.subject = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                expect(component.errorCode).toBe(
                    (component as any).SubjectError
                );
            }
        ));

        it('should return provided error', inject(
            [SubjectService],
            async (service: SubjectService) => {
                spyOn(service, 'getExerciseTree').and.rejectWith({});
                await setAsyncTimeout(50);
                for (const errorCode of [401, 403, 404, 500]) {
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

    describe('checkNodeChildren', () => {
        it('should return true (has Subcategories)', inject(
            [SubjectService],
            async () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                expect(component).toBeTruthy();

                await setAsyncTimeout(50);
                expect(
                    component.checkNodeChildren(tree.children[1])
                ).toBeTrue();
            }
        ));

        it('should return false (has no Subcategories)', inject(
            [SubjectService],
            async () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                expect(component).toBeTruthy();

                await setAsyncTimeout(50);
                expect(
                    component.checkNodeChildren(tree.children[0].children[1])
                ).toBeFalse();
            }
        ));
    });

    describe('checkNodeIfCategory', () => {
        it('should return true', inject([SubjectService], async () => {
            if (!tree) {
                fail('TEST FAILURE - Tree creation error');
                return;
            }
            expect(component).toBeTruthy();

            await setAsyncTimeout(50);
            expect(
                component.checkNodeIfIsCategory(tree.children[0])
            ).toBeTrue();
        }));

        it('should return false (has url)', inject(
            [SubjectService],
            async () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                expect(component).toBeTruthy();

                await setAsyncTimeout(50);
                expect(
                    component.checkNodeIfIsCategory(
                        tree.children[0].children[0]
                    )
                ).toBeFalse();
            }
        ));

        it('should return false (has no value)', inject(
            [SubjectService],
            async () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                expect(component).toBeTruthy();

                await setAsyncTimeout(50);
                expect(
                    component.checkNodeIfIsCategory(tree.children[2])
                ).toBeFalse();
            }
        ));
    });

    describe('onTreeNodeClick', () => {
        let exercisesSpy: jasmine.Spy;

        beforeEach(async () => {
            await setAsyncTimeout(50);
            exercisesSpy = spyOn(component, 'getCurrentNodeExercises');
        });

        it('should select provided node', inject([SubjectService], () => {
            if (!tree) {
                fail('TEST FAILURE - Tree creation error');
                return;
            }
            const node = tree.children[1];
            expect(component).toBeTruthy();

            component.onTreeNodeClick(node);
            expect(component.currentNode).toEqual(node);
            expect(node.isSelected).toBeTrue();
            expect(exercisesSpy).toHaveBeenCalledWith();
            expectOneSelected();
        }));

        it('should select provided node (previous - sibling)', inject(
            [SubjectService],
            () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                const node = tree.children[1];
                const sibling = tree.children[0];
                sibling.isSelected = true;
                component.currentNode = sibling;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onTreeNodeClick(node);
                expect(component.currentNode).toEqual(node);
                expect(node.isSelected).toBeTrue();
                expect(sibling.isSelected).toBeFalse();
                expect(exercisesSpy).toHaveBeenCalledWith();
                expectOneSelected();
            }
        ));

        it(`should unselect provided node (previous - child's child)`, inject(
            [SubjectService],
            () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                const node = tree.children[1];
                node.isSelected = true;
                const current = node.children[0].children[0];
                current.isSelected = true;
                node.children[0].isSelected = true;
                component.currentNode = current;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onTreeNodeClick(node);
                expect(component.currentNode).toEqual(tree);
                expect(node.isSelected).toBeFalse();
                expect(current.isSelected).toBeFalse();
                expect(exercisesSpy).toHaveBeenCalledWith();
                expectNoneSelected();
            }
        ));

        it('should unselect top-level node', inject([SubjectService], () => {
            if (!tree) {
                fail('TEST FAILURE - Tree creation error');
                return;
            }
            const node = tree;
            node.isSelected = true;
            component.currentNode = node;
            component.categoryTree = tree;
            fixture.detectChanges();
            expect(component).toBeTruthy();

            component.onTreeNodeClick(node);
            expect(component.currentNode).toEqual(tree);
            expect(node.isSelected).toBeFalse();
            expect(exercisesSpy).toHaveBeenCalledWith();
            expectNoneSelected();
        }));

        function expectOneSelected() {
            if (!tree) {
                fail('TEST FAILURE - Tree undefined');
                return;
            }
            expect(countSelected(tree)).toBe(1);
        }

        function expectNoneSelected() {
            if (!tree) {
                fail('TEST FAILURE - Tree undefined');
                return;
            }
            expect(countSelected(tree)).toBe(0);
        }

        function countSelected(node: ViewExerciseTreeNode): number {
            return node.children.reduce(
                (acc: number, child: ViewExerciseTreeNode) =>
                    acc + countSelected(child),
                node.isSelected ? 1 : 0
            );
        }
    });

    describe('clearSelectedChildren', () => {
        it('should unselect all children recursively', inject(
            [SubjectService],
            async () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                tree.children[1].isSelected = true;
                tree.children[1].children[0].isSelected = true;
                tree.children[1].children[0].children[0].isSelected = true;
                expect(component).toBeTruthy();

                await setAsyncTimeout(50);
                component.clearSelectedChildren(tree);
                expect(tree.children[1].isSelected).toBeFalse();
                expect(tree.children[1].children[0].isSelected).toBeFalse();
                expect(
                    tree.children[1].children[0].children[0].isSelected
                ).toBeFalse();
            }
        ));
    });

    describe('getCurrentNodeExercises', () => {
        it('should set list as null (no current node)', inject(
            [SubjectService],
            async () => {
                await setAsyncTimeout(50);
                component.exerciseList = [];
                component.currentNode = undefined;
                expect(component).toBeTruthy();

                component.getCurrentNodeExercises();
                expect(component.exerciseList).toBeNull();
            }
        ));

        it('should throw SubjectError', inject([SubjectService], async () => {
            if (!tree) {
                fail('TEST FAILURE - Tree creation error');
                return;
            }
            await setAsyncTimeout(50);
            component.exerciseList = [];
            component.currentNode = tree;
            component.subject = undefined;
            expect(component).toBeTruthy();

            component.getCurrentNodeExercises();
            expect((component as any)._errorCode).toBe(
                (component as any).SubjectError
            );
            expect(component.exerciseList).toBeNull();
        }));

        it('should set list as null (no Exercises in current node)', inject(
            [SubjectService],
            async () => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                component.exerciseList = [];
                component.currentNode = tree;
                expect(component).toBeTruthy();

                component.getCurrentNodeExercises();
                expect(component.exerciseList).toBeNull();
            }
        ));

        it('should throw type error (missing Exercise type)', inject(
            [SubjectService],
            async () => {
                tree = createTree(subjectId, true);
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                component.currentNode = tree;
                expect(component).toBeTruthy();

                component.getCurrentNodeExercises();
                expect(component.exerciseError).toEqual({
                    code: TYPE_ERROR,
                    id: 'err'
                });
            }
        ));

        it('should set Exercises', inject([SubjectService], async () => {
            if (!tree) {
                fail('TEST FAILURE - Tree creation error');
                return;
            }
            await setAsyncTimeout(50);
            component.currentNode = tree.children[0].children[1];
            expect(component).toBeTruthy();

            component.getCurrentNodeExercises();
            expect(component.isExerciseLoading).toBeTrue();
            expect(component.exerciseList).toEqual([
                {
                    id: 'kula-0',
                    type: 'EqEx',
                    name: 'Kula 0',
                    desc: 'TODO'
                },
                {
                    id: 'kula-1',
                    type: 'EqEx',
                    name: 'Kula 1',
                    desc: 'TODO'
                }
            ]);
        }));
    });

    describe('isLast', () => {
        beforeEach(async () => {
            await setAsyncTimeout(50);
            component.exerciseList = [{}, {}] as any[];
            fixture.detectChanges();
        });

        it('should return true (exerciseList null)', inject(
            [SubjectService],
            () => {
                component.exerciseList = null;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                expect(component.isLast(0)).toBeTrue();
            }
        ));

        it('should return false', inject([SubjectService], () => {
            expect(component).toBeTruthy();

            expect(component.isLast(0)).toBeFalse();
        }));

        it('should return true', inject([SubjectService], () => {
            expect(component).toBeTruthy();

            expect(component.isLast(1)).toBeTrue();
        }));
    });

    describe('navigateToExerciseCreation', () => {
        it('should should set new Exercise hierarchy & navigate to creation', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const parentNode = tree.children[1];
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchy'
                );
                const routerSpy = spyOn(router, 'navigate');
                expect(component).toBeTruthy();

                component.navigateToExerciseCreation(parentNode);
                expect(hierarchySpy).toHaveBeenCalledWith(parentNode);
                expect(routerSpy).toHaveBeenCalledWith([
                    '/subject/exercise-new',
                    subjectId
                ]);
            }
        ));

        it('should should do nothing (no subject)', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const parentNode = tree.children[1];
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchy'
                );
                const routerSpy = spyOn(router, 'navigate');
                component.subject = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.navigateToExerciseCreation(parentNode);
                expect(hierarchySpy).not.toHaveBeenCalled();
                expect(routerSpy).not.toHaveBeenCalled();
            }
        ));
    });

    describe('navigateToExerciseCreationFromRoot', () => {
        it('should should set new Exercise hierarchy & navigate to creation', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchyAsRoot'
                );
                const routerSpy = spyOn(router, 'navigate');
                expect(component).toBeTruthy();

                component.navigateToExerciseCreationFromRoot();
                expect(hierarchySpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith([
                    '/subject/exercise-new',
                    subjectId
                ]);
            }
        ));

        it('should should do nothing (no subject)', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchyAsRoot'
                );
                const routerSpy = spyOn(router, 'navigate');
                component.subject = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.navigateToExerciseCreationFromRoot();
                expect(hierarchySpy).not.toHaveBeenCalled();
                expect(routerSpy).not.toHaveBeenCalled();
            }
        ));
    });

    describe('navigateToExerciseModification', () => {
        it('should should set new Exercise hierarchy & navigate to creation', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const parentNode = tree.children[1];
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchy'
                );
                const routerSpy = spyOn(router, 'navigate');
                expect(component).toBeTruthy();

                component.navigateToCategoryModification(parentNode);
                expect(hierarchySpy).toHaveBeenCalledWith(parentNode);
                expect(routerSpy).toHaveBeenCalledWith([
                    '/subject/category-edit',
                    subjectId
                ]);
            }
        ));

        it('should should do nothing (no subject)', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const parentNode = tree.children[1];
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchy'
                );
                const routerSpy = spyOn(router, 'navigate');
                component.subject = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.navigateToCategoryModification(parentNode);
                expect(hierarchySpy).not.toHaveBeenCalled();
                expect(routerSpy).not.toHaveBeenCalled();
            }
        ));
    });

    describe('navigateToExerciseModificationFromRoot', () => {
        it('should should set new Exercise hierarchy & navigate to creation', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchyAsRoot'
                );
                const routerSpy = spyOn(router, 'navigate');
                expect(component).toBeTruthy();

                component.navigateToCategoryModificationFromRoot();
                expect(hierarchySpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith([
                    '/subject/category-edit',
                    subjectId
                ]);
            }
        ));

        it('should should do nothing (no subject)', inject(
            [SubjectService, HierarchyService, Router],
            async (
                _: SubjectService,
                hierarchyService: HierarchyService,
                router: Router
            ) => {
                if (!tree) {
                    fail('TEST FAILURE - Tree creation error');
                    return;
                }
                await setAsyncTimeout(50);
                const hierarchySpy = spyOn(
                    hierarchyService,
                    'setNewExerciseHierarchyAsRoot'
                );
                const routerSpy = spyOn(router, 'navigate');
                component.subject = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.navigateToCategoryModificationFromRoot();
                expect(hierarchySpy).not.toHaveBeenCalled();
                expect(routerSpy).not.toHaveBeenCalled();
            }
        ));
    });

    describe('getErrorMessage', () => {
        beforeEach(async () => {
            await setAsyncTimeout(50);
        });

        it('should return NotFoundError', inject([SubjectService], () => {
            expect(component).toBeTruthy();

            expect(component.getErrorMessage(404)).toBe(
                'Ups, przedmiot, którego szukasz, nie istnieje!'
            );
        }));

        it('should return default', inject([SubjectService], () => {
            expect(component).toBeTruthy();

            for (const errorCode of [401, 403, 500]) {
                expect(component.getErrorMessage(errorCode))
                    .withContext(`Code: ${errorCode}`)
                    .toBeUndefined();
            }
        }));
    });

    describe('getExerciseErrorMessage', () => {
        beforeEach(async () => {
            await setAsyncTimeout(50);
        });

        it('should return generic message', inject([SubjectService], () => {
            expect(component).toBeTruthy();

            const errors = [401, 403, 404, 500];
            for (let i = 0; i < errors.length; i++) {
                const errorCode = errors[i];
                const exerciseId = `ex${i}`;
                expect(
                    component.getExerciseErrorMessage({
                        code: errorCode,
                        id: exerciseId
                    })
                )
                    .withContext(`Code: ${errorCode}`)
                    .toBe(`Błąd podczas ładowania zadania '${exerciseId}'`);
            }
        }));
    });
});

function createTree(
    subjectId: string,
    includeWrongExercise: boolean = false
): ViewExerciseTreeNode | null {
    const serverResponse = [
        {
            name: 'Test',
            children: [
                {
                    type: 'EqEx',
                    name: 'Kula 2',
                    children: 'kula-2',
                    description: 'TODO',
                    done: null
                },
                {
                    name: 'Test sub',
                    children: [
                        {
                            type: 'EqEx',
                            name: 'Kula 0',
                            children: 'kula-0',
                            description: 'TODO',
                            done: null
                        },
                        {
                            type: 'EqEx',
                            name: 'Kula 1',
                            children: 'kula-1',
                            description: 'TODO',
                            done: null
                        }
                    ]
                }
            ]
        },
        {
            name: 'mechanika',
            children: [
                {
                    name: 'kinematyka',
                    children: [
                        {
                            type: 'EqEx',
                            name: 'Pociągi dwa 2',
                            children: 'pociagi-dwa',
                            description:
                                'Z miast \\(A\\) i \\(B\\) odległych o \\(d= 300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_{a}= \\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_{b}= \\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?\n',
                            done: 0.34
                        }
                    ]
                }
            ]
        },
        {
            name: '',
            children: [
                {
                    type: 'EqEx',
                    name: 'Kula 3',
                    children: 'kula-3',
                    description: 'TODO',
                    done: null
                }
            ]
        }
    ];
    if (includeWrongExercise) {
        serverResponse.push({
            name: 'error',
            children: 'err',
            description: 'ERROR',
            done: null
        } as any);
    }
    const subject = {
        name: subjectId,
        children: serverResponse
    };

    const result = Subject.createSubject(subject as any, false);
    if (!result) return null;
    return new ViewExerciseTreeNode(result);
}
