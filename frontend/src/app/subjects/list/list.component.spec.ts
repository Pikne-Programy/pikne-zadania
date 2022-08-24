/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { setAsyncTimeout } from 'src/app/helper/tests/tests.utils';
import { TeamService } from 'src/app/user/team.service/team.service';
import { AssigneeUser } from 'src/app/user/team.service/types';
import { Subject, SubjectService } from '../subject.service/subject.service';

import { mapUsers, SubjectListComponent } from './list.component';

describe('SubjectListComponent', () => {
    let component: SubjectListComponent;
    let fixture: ComponentFixture<SubjectListComponent>;
    const subjects = ['_sb3', 'sb1', 'sb2', '_sb1'].map(
        (id) => new Subject(id)
    );
    const subjectServiceMock = {
        getSubjects: () => Promise.resolve(subjects),
        addSubject: (name: string, _isPrivate: boolean, _assignees: string[]) =>
            Promise.resolve(`Added subject '${name}'`)
    };
    const teamServiceMock = {
        getAssigneeList: () => Promise.resolve([])
    };
    const routerMock = {
        navigate: (_: any[]) => Promise.resolve(true)
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SubjectListComponent],
            providers: [
                { provide: SubjectService, useValue: subjectServiceMock },
                { provide: TeamService, useValue: teamServiceMock },
                { provide: Router, useValue: routerMock }
            ]
        }).compileComponents();
    }));

    function setupTest() {
        fixture = TestBed.createComponent(SubjectListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('should create', inject(
        [SubjectService, TeamService, Router],
        async () => {
            setupTest();
            expect(component).toBeTruthy();

            await setAsyncTimeout(10);
            expect(component.subjectList).toEqual(subjects);
            expect(component.errorCode).toBeNull();
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/ error', inject(
        [SubjectService, TeamService, Router],
        async (subjectService: SubjectService) => {
            //#region Mocks & setup
            const errorCode = 500;
            spyOn(subjectService, 'getSubjects').and.rejectWith({
                status: errorCode
            });
            setupTest();
            //#endregion
            expect(component).toBeTruthy();

            await setAsyncTimeout(10);
            expect(component.subjectList).toEqual([]);
            expect(component.errorCode).toBe(errorCode);
            expect(component.isLoading).toBeFalse();
        }
    ));

    describe('createList', () => {
        it('should map subjects to SpecialPanelItems', inject(
            [SubjectService, TeamService, Router],
            async () => {
                setupTest();
                expect(component).toBeTruthy();

                await setAsyncTimeout(10);
                expect(component.createList()).toEqual(
                    subjects.map((subject) => [
                        subject.getName(),
                        subject.id,
                        subject.isPrivate ? 'fa-lock' : 'fa-book',
                        false,
                        subject.isPrivate
                    ])
                );
            }
        ));
    });

    describe('Modal', () => {
        beforeEach(() => {
            setupTest();
        });

        it('should reset & open modal', inject(
            [SubjectService, TeamService, Router],
            async (_: SubjectService, teamService: TeamService) => {
                expect(component).toBeTruthy();
                //#region Initial values & spies
                component.isModalOpen = false;
                component.modalName = 'Modal name';
                component.modalAssigneeList = [];
                component.modalErrorCode = 401;
                component.modalAssigneeErrorCode = 500;
                component.modalPrivateState = true;
                fixture.detectChanges();

                const teamSpy = spyOn(teamService, 'getAssigneeList');
                teamSpy.and.callFake(async () => {
                    await setAsyncTimeout(10);
                    return [];
                });
                //#endregion

                component.openModal();
                expect(component.isModalOpen).toBeTrue();
                //#region Modal reset
                expect(component.modalName).toBe('');
                expect(component.modalAssigneeList).toBeUndefined();
                expect(component.modalErrorCode).toBeNull();
                expect(component.modalAssigneeErrorCode).toBeNull();
                expect(component.modalPrivateState).toBeFalse();
                //#endregion

                await setAsyncTimeout(20);
                expect(component.modalAssigneeList).toEqual([]);
                expect(component.modalAssigneeErrorCode).toBeNull();

                const errorCode = 500;
                teamSpy.and.rejectWith({ status: errorCode });
                component.openModal();
                await setAsyncTimeout(20);
                expect(component.modalAssigneeErrorCode)
                    .withContext('Promise rejected')
                    .toBe(errorCode);
                expect(component.modalAssigneeList)
                    .withContext('Promise rejected')
                    .toBeUndefined();
            }
        ));

        it('should close & reset modal', inject(
            [SubjectService, TeamService, Router],
            () => {
                expect(component).toBeTruthy();
                //#region Initial values
                component.isModalOpen = true;
                component.modalName = 'Modal name';
                component.modalAssigneeList = [];
                component.modalErrorCode = 401;
                component.modalAssigneeErrorCode = 500;
                component.modalPrivateState = true;
                fixture.detectChanges();
                //#endregion

                component.closeModal();
                expect(component.isModalOpen).toBeFalse();
                expect(component.modalName).toBe('');
                expect(component.modalAssigneeList).toBeUndefined();
                expect(component.modalErrorCode).toBeNull();
                expect(component.modalAssigneeErrorCode).toBeNull();
                expect(component.modalPrivateState).toBeFalse();
            }
        ));

        describe('isModalValid', () => {
            it('should return true', inject(
                [SubjectService, TeamService, Router],
                () => {
                    expect(component).toBeTruthy();
                    component.modalName = 'Modal name';
                    component.modalAssigneeList = [];
                    component.modalAssigneeErrorCode = null;
                    fixture.detectChanges();

                    expect(component.isModalValid()).toBeTrue();
                }
            ));

            it('should return false', inject(
                [SubjectService, TeamService, Router],
                () => {
                    expect(component).toBeTruthy();

                    component.modalName = '     ';
                    fixture.detectChanges();
                    expect(component.isModalValid())
                        .withContext('Empty modalName')
                        .toBeFalse();

                    component.modalName = 'Modal name';
                    component.modalAssigneeList = undefined;
                    fixture.detectChanges();
                    expect(component.isModalValid())
                        .withContext('Undefined modalAssigneeList')
                        .toBeFalse();

                    component.modalAssigneeList = [];
                    component.modalAssigneeErrorCode = 404;
                    fixture.detectChanges();
                    expect(component.isModalValid())
                        .withContext('Assignee error')
                        .toBeFalse();
                }
            ));
        });

        describe('gerModalErrorMessage', () => {
            it('should return ID error message', inject(
                [SubjectService, TeamService, Router],
                () => {
                    expect(component).toBeTruthy();
                    component.modalName = 'Modal name';
                    component.modalAssigneeList = [];
                    component.modalAssigneeErrorCode = null;
                    fixture.detectChanges();

                    expect(component.getModalErrorMessage(409)).toBe(
                        'Przedmiot o takiej nazwie już istnieje'
                    );
                }
            ));

            it('should return default error message', inject(
                [SubjectService, TeamService, Router],
                () => {
                    expect(component).toBeTruthy();

                    for (const error of [401, 403, 404, 500]) {
                        expect(component.getModalErrorMessage(error)).toBe(
                            `Wystąpił błąd (${error})`
                        );
                    }
                }
            ));
        });
    });

    describe('addNewSubject', () => {
        beforeEach(() => {
            setupTest();
        });

        it('should add new Subject', inject(
            [SubjectService, TeamService, Router],
            async (
                subjectService: SubjectService,
                _: TeamService,
                router: Router
            ) => {
                const newId = 'new-sb';
                const subjectServiceSpy = spyOn(
                    subjectService,
                    'addSubject'
                ).and.resolveTo(newId);
                const routerSpy = spyOn(router, 'navigate');
                for (const isPrivate of [false, true]) {
                    //#region Input values
                    const name = 'New Subject';
                    const selectedUsers = ['u1', 'u2', 'u3'];
                    component.modalName = `    ${name}    `;
                    component.modalAssigneeList = selectedUsers.map(
                        (id, i) => ({
                            userId: id,
                            name: `User ${i}`,
                            number: null,
                            isSelected: true
                        })
                    );
                    for (
                        let i = selectedUsers.length;
                        i < selectedUsers.length + 5;
                        i++
                    ) {
                        component.modalAssigneeList.push({
                            userId: `u${i}`,
                            name: `User ${i}`,
                            number: null,
                            isSelected: false
                        });
                    }
                    component.modalPrivateState = isPrivate;
                    fixture.detectChanges();
                    //#endregion
                    expect(component)
                        .withContext(getContext(isPrivate))
                        .toBeTruthy();

                    component.addNewSubject();
                    expect(component.isModalLoading)
                        .withContext(getContext(isPrivate))
                        .toBeTrue();
                    await setAsyncTimeout(10);
                    expect(subjectServiceSpy)
                        .withContext(getContext(isPrivate))
                        .toHaveBeenCalledWith(name, isPrivate, selectedUsers);
                    expect(routerSpy)
                        .withContext(getContext(isPrivate))
                        .toHaveBeenCalledWith(['/subject/dashboard', newId]);
                    expect(component.isModalLoading)
                        .withContext(getContext(isPrivate))
                        .toBeFalse();
                }
            }
        ));

        it('should throw error', inject(
            [SubjectService, TeamService, Router],
            async (subjectService: SubjectService) => {
                //#region Setup
                const errorCode = 500;
                spyOn(subjectService, 'addSubject').and.rejectWith({
                    status: errorCode
                });
                component.modalName = 'New Subject';
                component.modalAssigneeList = [];
                component.modalPrivateState = false;
                fixture.detectChanges();
                //#endregion
                expect(component).toBeTruthy();

                component.addNewSubject();
                expect(component.isModalLoading).toBeTrue();
                await setAsyncTimeout(10);
                expect(component.modalErrorCode).toBe(errorCode);
                expect(component.isModalLoading).toBeFalse();
            }
        ));

        it('should do nothing (modal not valid)', inject(
            [SubjectService, TeamService, Router],
            (subjectService: SubjectService) => {
                spyOn(component, 'isModalValid').and.returnValue(false);
                const spy = spyOn(subjectService, 'addSubject');
                expect(component).toBeTruthy();

                component.addNewSubject();
                expect(spy).not.toHaveBeenCalled();
            }
        ));

        function getContext(isPrivate: boolean): string {
            return isPrivate ? 'Private' : 'Public';
        }
    });

    describe('mapUsers', () => {
        it('should map AssigneeUsers to UserItems', () => {
            const list: AssigneeUser[] = [];
            for (let i = 0; i < 5; i++) {
                list.push({
                    userId: `user${i}`,
                    name: `User ${i}`,
                    number: i % 2 === 0 ? i : null
                });
            }
            expect(mapUsers(list)).toEqual(
                list.map((u) => ({
                    userId: u.userId,
                    name: u.name,
                    number: u.number,
                    isSelected: false
                }))
            );
        });
    });
});
