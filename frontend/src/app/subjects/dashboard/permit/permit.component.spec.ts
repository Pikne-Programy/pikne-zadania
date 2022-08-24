import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Params, setAsyncTimeout } from 'src/app/helper/tests/tests.utils';
import { INTERNAL_ERROR } from 'src/app/helper/utils';
import { TeamService } from 'src/app/user/team.service/team.service';
import { AssigneeUser } from 'src/app/user/team.service/types';
import {
    Assignee,
    Subject,
    SubjectService
} from '../../subject.service/subject.service';

import { SubjectPermitComponent } from './permit.component';

describe('SubjectPermitComponent', () => {
    let component: SubjectPermitComponent;
    let fixture: ComponentFixture<SubjectPermitComponent>;
    const subjectId = 'sb1';
    const subjectServiceMock = {
        getAssignees: (_subjectId: string, _teachers: AssigneeUser[]) =>
            Promise.resolve([]),
        setAssignees: (_subjectId: string, _assignees: Assignee[] | null) =>
            Promise.resolve()
    };
    const teamServiceMock = {
        getAssigneeList: () => Promise.resolve([])
    };
    const routerMock = {
        navigate: (_: any[]) => Promise.resolve(true),
        navigateByUrl: (_: string) => Promise.resolve(true)
    };
    const routeMock = {
        paramMap: new Params([['subjectId', subjectId]])
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SubjectPermitComponent],
            providers: [
                { provide: SubjectService, useValue: subjectServiceMock },
                { provide: TeamService, useValue: teamServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: routeMock }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SubjectPermitComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', inject(
        [SubjectService, TeamService, Router, ActivatedRoute],
        async (subjectService: SubjectService, teamService: TeamService) => {
            spyOn(teamService, 'getAssigneeList').and.resolveTo([]);
            spyOn(subjectService, 'getAssignees').and.resolveTo([]);
            expect(component).toBeTruthy();
            expect(component.isLoading).toBeTrue();

            await setAsyncTimeout(50);
            expect(component.subjectId).toBe(subjectId);
            expect((component as any).teacherList).toBeDefined();
            expect(component.assignees).toBeDefined();
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/ all assignees selected', inject(
        [SubjectService, TeamService, Router, ActivatedRoute],
        async (subjectService: SubjectService, teamService: TeamService) => {
            //#region Spies & expected values
            const assigneeList: AssigneeUser[] = [];
            const assignees: Assignee[] = [];
            for (let i = 0; i < 5; i++) {
                assigneeList.push({
                    userId: `user${i}`,
                    name: `User ${i}`,
                    number: null
                });
                assignees.push({
                    userId: `user${i}`,
                    name: `User ${i}`,
                    isSelected: false
                });
            }
            spyOn(teamService, 'getAssigneeList').and.resolveTo(assigneeList);
            spyOn(subjectService, 'getAssignees').and.rejectWith({
                status: SubjectService.ALL_ASSIGNEES_SELECTED
            });
            //#endregion
            expect(component).toBeTruthy();
            expect(component.isLoading).toBeTrue();

            await setAsyncTimeout(50);
            expect(component.subjectId).toBe(subjectId);
            expect((component as any).teacherList).toEqual(assigneeList);
            expect(component.assignees).toEqual(assignees);
            expect(component.allSelected).toBeTrue();
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/ teacher error', inject(
        [SubjectService, TeamService, Router, ActivatedRoute],
        async (_: SubjectService, teamService: TeamService) => {
            const errorCode = 500;
            spyOn(teamService, 'getAssigneeList').and.rejectWith({
                status: errorCode
            });
            expect(component).toBeTruthy();
            expect(component.isLoading).toBeTrue();

            await setAsyncTimeout(50);
            expect(component.subjectId).toBe(subjectId);
            expect((component as any)._errorCode).toEqual([errorCode, 't']);
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/ assignee error', inject(
        [SubjectService, TeamService, Router, ActivatedRoute],
        async (subjectService: SubjectService, teamService: TeamService) => {
            const errorCode = 500;
            spyOn(teamService, 'getAssigneeList').and.resolveTo([]);
            spyOn(subjectService, 'getAssignees').and.rejectWith({
                status: errorCode
            });
            expect(component).toBeTruthy();
            expect(component.isLoading).toBeTrue();

            await setAsyncTimeout(100);
            expect(component.subjectId).toBe(subjectId);
            expect((component as any).teacherList).toBeDefined();
            expect((component as any)._errorCode).toEqual([errorCode, 'a']);
            expect(component.isLoading).toBeFalse();
        }
    ));

    describe('getError', () => {
        const errors = [401, 403, 404, 500];

        it('should return null', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                setPrivateError(null);
                expect(component).toBeTruthy();

                expect(component.errorCode).toBeNull();
            }
        ));

        it('should return Teacher error', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                for (const errorCode of errors) {
                    setPrivateError([errorCode, 't']);
                    expect(component).toBeTruthy();

                    expect(component.errorCode).toBe(`${errorCode}t`);
                }
            }
        ));

        it('should return Assignee error', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                for (const errorCode of errors) {
                    setPrivateError([errorCode, 'a']);
                    expect(component).toBeTruthy();

                    expect(component.errorCode).toBe(`${errorCode}a`);
                }
            }
        ));

        function setPrivateError(error: [number, 't' | 'a'] | null) {
            (component as any)._errorCode = error;
        }
    });

    describe('getPanelHeader', () => {
        beforeEach(() => {
            spyOn(Subject, 'getSubjectName').and.callFake((name) => name);
        });

        it('should return Subject name', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                component.subjectId = subjectId;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                expect(component.getPanelHeader()).toBe(subjectId);
            }
        ));

        it('should return empty', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                expect(component).toBeTruthy();

                expect(component.getPanelHeader()).toBe('');
            }
        ));
    });

    describe('checkAll', () => {
        it('should select all', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                component.allSelected = false;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.checkAll();
                expect(component.allSelected).toBeTrue();
                expect(component.isModified()).toBeTrue();
            }
        ));

        it('should unselect all', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                component.allSelected = true;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.checkAll();
                expect(component.allSelected).toBeFalse();
                expect(component.isModified()).toBeTrue();
            }
        ));
    });

    describe('checkAssignee', () => {
        it('should select Assignee', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                const assignee: Assignee = {
                    userId: 'user1',
                    name: 'User 1',
                    isSelected: false
                };
                expect(component).toBeTruthy();
                expect(assignee.isSelected).toBeFalse();

                component.checkAssignee(assignee);
                expect(assignee.isSelected).toBeTrue();
                expect(component.isModified()).toBeTrue();
            }
        ));

        it('should unselect Assignee', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                const assignee: Assignee = {
                    userId: 'user1',
                    name: 'User 1',
                    isSelected: true
                };
                expect(component).toBeTruthy();
                expect(assignee.isSelected).toBeTrue();

                component.checkAssignee(assignee);
                expect(assignee.isSelected).toBeFalse();
                expect(component.isModified()).toBeTrue();
            }
        ));
    });

    describe('isModified', () => {
        for (const isModified of [true, false]) {
            it(`should return ${isModified}`, inject(
                [SubjectService, TeamService, Router, ActivatedRoute],
                () => {
                    (component as any)._isModified = isModified;
                    fixture.detectChanges();
                    expect(component).toBeTruthy();

                    expect(component.isModified()).toBe(isModified);
                }
            ));
        }
    });

    describe('submit', () => {
        const assignees: Assignee[] = [];
        for (let i = 0; i < 5; i++) {
            assignees.push({
                userId: `user${i}`,
                name: `User ${i}`,
                isSelected: i % 2 === 0
            });
        }

        function setupTest() {
            component.subjectId = subjectId;
            component.assignees = assignees;
            component.isLoading = false;
            fixture.detectChanges();
        }

        it('should submit Assignees & navigate up', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            async (
                subjectService: SubjectService,
                _: TeamService,
                router: Router
            ) => {
                const serviceSpy = spyOn(
                    subjectService,
                    'setAssignees'
                ).and.callFake(async () => {
                    await setAsyncTimeout(20);
                    return {};
                });
                const submitSpy = spyOn(component as any, 'setSubmitFlag');
                const routerSpy = spyOn(router, 'navigate');
                const navSpy = spyOn(component, 'resetNavigation');
                setupTest();
                expect(component).toBeTruthy();

                component.submit();
                expect(component.isSubmitLoading).toBeTrue();
                await setAsyncTimeout(50);
                expect(serviceSpy).toHaveBeenCalledWith(subjectId, assignees);
                expect(submitSpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith(['../'], {
                    relativeTo: routeMock as any
                });
                expect(component.isSubmitLoading).toBeFalse();
                expect(navSpy).toHaveBeenCalledWith();
            }
        ));

        it('should submit All-Selected', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            async (subjectService: SubjectService) => {
                const serviceSpy = spyOn(
                    subjectService,
                    'setAssignees'
                ).and.resolveTo([]);
                component.allSelected = true;
                setupTest();
                expect(component).toBeTruthy();

                component.submit();
                await setAsyncTimeout(50);
                expect(serviceSpy).toHaveBeenCalledWith(subjectId, null);
            }
        ));

        it('should submit Assignees & navigate to provided route', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            async (
                subjectService: SubjectService,
                _: TeamService,
                router: Router
            ) => {
                const route = '/test/route';
                const serviceSpy = spyOn(
                    subjectService,
                    'setAssignees'
                ).and.callFake(async () => {
                    await setAsyncTimeout(20);
                    return {};
                });
                const submitSpy = spyOn(component as any, 'setSubmitFlag');
                const routerSpy = spyOn(router, 'navigateByUrl');
                const navSpy = spyOn(component, 'resetNavigation');
                setupTest();
                expect(component).toBeTruthy();

                component.submit(route);
                expect(component.isSubmitLoading).toBeTrue();
                await setAsyncTimeout(50);
                expect(serviceSpy).toHaveBeenCalledWith(subjectId, assignees);
                expect(submitSpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith(route);
                expect(component.isSubmitLoading).toBeFalse();
                expect(navSpy).toHaveBeenCalledWith();
            }
        ));

        it('should submit Assignees w/ error', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            async (subjectService: SubjectService) => {
                const errorCode = 500;
                const serviceSpy = spyOn(
                    subjectService,
                    'setAssignees'
                ).and.rejectWith({ status: errorCode });
                const navSpy = spyOn(component, 'resetNavigation');
                setupTest();
                expect(component).toBeTruthy();

                component.submit();
                await setAsyncTimeout(50);
                expect(serviceSpy).toHaveBeenCalledWith(subjectId, assignees);
                expect(component.submitErrorCode).toBe(errorCode);
                expect(component.isSubmitLoading).toBeFalse();
                expect(navSpy).toHaveBeenCalledWith();
            }
        ));

        it('should throw Internal Error (no subjectId)', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                component.subjectId = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.submit();
                expect(component.submitErrorCode).toBe(INTERNAL_ERROR);
            }
        ));

        it('should throw Internal Error (no assignees)', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                component.assignees = undefined;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.submit();
                expect(component.submitErrorCode).toBe(INTERNAL_ERROR);
            }
        ));
    });

    describe('cancel', () => {
        it('should cancel', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            (_ss: SubjectService, _ts: TeamService, router: Router) => {
                const exitSpy = spyOn(component as any, 'confirmExit');
                const routerSpy = spyOn(router, 'navigate');
                expect(component).toBeTruthy();

                component.cancel();
                expect(exitSpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith(['../'], {
                    relativeTo: routeMock as any
                });
            }
        ));
    });

    describe('onExitSubmit', () => {
        it('should submit', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            () => {
                const submitSpy = spyOn(component, 'submit');
                const route = '/test/route';
                component.nextState = route;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onExitSubmit();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(submitSpy).toHaveBeenCalledWith(route);
            }
        ));
    });

    describe('onExitDiscard', () => {
        it('should exit & navigate to provided route', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            (_ss: SubjectService, _ts: TeamService, router: Router) => {
                const exitSpy = spyOn(component as any, 'confirmExit');
                const routerSpy = spyOn(router, 'navigateByUrl');
                const route = '/test/route';
                component.nextState = route;
                fixture.detectChanges();
                expect(component).toBeTruthy();

                component.onExitDiscard();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(exitSpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith(route);
            }
        ));

        it('should exit & navigate up', inject(
            [SubjectService, TeamService, Router, ActivatedRoute],
            (_ss: SubjectService, _ts: TeamService, router: Router) => {
                const exitSpy = spyOn(component as any, 'confirmExit');
                const routerSpy = spyOn(router, 'navigate');
                expect(component).toBeTruthy();

                component.onExitDiscard();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(exitSpy).toHaveBeenCalledWith();
                expect(routerSpy).toHaveBeenCalledWith(['../'], {
                    relativeTo: routeMock as any
                });
            }
        ));
    });
});
