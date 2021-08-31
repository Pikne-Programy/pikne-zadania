/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { HttpClient } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { TeamService } from './team.service';
import * as ServerRoutes from 'src/app/server-routes';
import * as Types from './types';
import { TYPE_ERROR } from 'src/app/helper/utils';

describe('Service: Team', () => {
    let httpController: HttpTestingController;
    const testList: [string, number | null][] = [
        ['throw server error', 500],
        ['resolve', null]
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TeamService, HttpClient]
        });

        httpController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpController.verify();
    });

    describe('Fetching', () => {
        describe('getTeams', () => {
            //#region Mock objects
            const teamList: Types.TeamItem[] = [];
            for (let i = 1; i <= 3; i++) {
                teamList.push({
                    id: i,
                    name: `${i}d`,
                    assignee: 'Smith'
                });
            }
            teamList[1].invitation = null;
            teamList[2].invitation = 'Test';
            //#endregion

            it(
                'should throw server error',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();
                            const errorCode = 500;

                            service
                                .getTeams()
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(errorCode)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.teamList
                            );

                            expect(req.request.method).toEqual('GET');
                            req.error(new ErrorEvent('Server error'), {
                                status: errorCode
                            });
                        }
                    )
                )
            );

            it(
                'should throw Type error',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();
                            const spy = jasmine
                                .createSpy()
                                .and.returnValue(false);
                            spyOnProperty(
                                Types,
                                'isTeamItemList'
                            ).and.returnValue(spy as any);

                            service
                                .getTeams()
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(TYPE_ERROR)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.teamList
                            );

                            expect(req.request.method).toEqual('GET');
                            req.flush(teamList);
                        }
                    )
                )
            );

            it(
                'should return TeamItem list',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();
                            const spy = jasmine
                                .createSpy()
                                .and.returnValue(true);
                            spyOnProperty(
                                Types,
                                'isTeamItemList'
                            ).and.returnValue(spy as any);

                            service
                                .getTeams()
                                .then((response) =>
                                    expect(response).toEqual(teamList)
                                )
                                .catch(() => fail('should resolve'));
                            const req = httpController.expectOne(
                                ServerRoutes.teamList
                            );

                            expect(req.request.method).toEqual('GET');
                            req.flush(teamList);
                        }
                    )
                )
            );
        });

        describe('getTeam', () => {
            const id = 2;

            it(
                'should throw server error',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();
                            const errorCode = 500;

                            service
                                .getTeam(id)
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(errorCode)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.team
                            );

                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual({ id });
                            req.error(new ErrorEvent('Server error'), {
                                status: errorCode
                            });
                        }
                    )
                )
            );

            it(
                'should throw Type error',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();

                            service
                                .getTeam(id)
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(TYPE_ERROR)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.team
                            );

                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual({ id });
                            req.flush(null);
                        }
                    )
                )
            );

            it(
                'should return Team w/o members & invitation',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();

                            expectTeam(service, httpController);
                        }
                    )
                )
            );

            it(
                'should return Team',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();
                            const invitation = 'Qwerty';
                            const [members, resultMembers] = getMembers();

                            expectTeam(
                                service,
                                httpController,
                                members,
                                resultMembers,
                                invitation
                            );
                        }
                    )
                )
            );
        });

        describe('getAssigneeList', () => {
            const TEACHER_TEAM_ID = 1;
            const PERMISSION_ERROR = 403;

            const list: [string, any, number][] = [
                ['server error', null, 500],
                [
                    'Type error',
                    {
                        abc: 'I am trashy object :P'
                    },
                    TYPE_ERROR
                ],
                [
                    'Permission error',
                    {
                        name: 'Teachers',
                        assignee: 'root'
                    },
                    PERMISSION_ERROR
                ]
            ];
            for (const [testMess, response, errorCode] of list) {
                it(
                    `should throw ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();

                                service
                                    .getAssigneeList()
                                    .then(() => fail('should be rejected'))
                                    .catch((error) =>
                                        expect(error.status).toBe(errorCode)
                                    );
                                const req = httpController.expectOne(
                                    ServerRoutes.team
                                );

                                expect(req.request.method).toEqual('POST');
                                expect(req.request.body).toEqual({
                                    id: TEACHER_TEAM_ID
                                });
                                if (response === null) {
                                    req.error(new ErrorEvent('Error'), {
                                        status: errorCode
                                    });
                                }
                                else req.flush(response);
                            }
                        )
                    )
                );
            }

            it(
                'should return assignee list',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();
                            const [members] = getMembers();
                            const result: Types.Team = {
                                name: 'Teachers',
                                assignee: 'root',
                                invitation: null,
                                members
                            };

                            service
                                .getAssigneeList()
                                .then((response) =>
                                    expect(response).toEqual(members)
                                )
                                .catch(() => fail('should resolve'));
                            const req = httpController.expectOne(
                                ServerRoutes.team
                            );

                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual({
                                id: TEACHER_TEAM_ID
                            });
                            req.flush(result);
                        }
                    )
                )
            );
        });
    });

    describe('Team modification & Registration', () => {
        const id = 4;

        describe('deleteTeam', () => {
            for (const [testMess, errorCode] of testList) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();

                                const promise = service.deleteTeam(id);
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamDelete,
                                    { id },
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });

        describe('setTeamName', () => {
            for (const [testMess, errorCode] of testList) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();
                                const name = 'New name';

                                const promise = service.setTeamName(id, name);
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { id, name },
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });

        describe('setAssignee', () => {
            for (const [testMess, errorCode] of testList) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();
                                const assignee = 'User1Id';

                                const promise = service.setAssignee(
                                    id,
                                    assignee
                                );
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { id, assignee },
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });

        describe('openTeam', () => {
            for (const [testMess, errorCode] of testList) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();
                                const invitation = 'QwErTy';

                                const promise = service.openTeam(
                                    id,
                                    invitation
                                );
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { id, invitation },
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });

        describe('closeTeam', () => {
            for (const [testMess, errorCode] of testList) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();
                                const invitation = null;

                                const promise = service.closeTeam(id);
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { id, invitation },
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });
    });

    describe('User modification', () => {
        const id = 'User1Id';

        describe('editUser', () => {
            const list: [
                string,
                { name?: string; number?: number | null },
                number | null
            ][] = [
                ['throw server error', {}, 500],
                ['edit name', { name: 'New name' }, null],
                ['edit number', { number: 12 }, null],
                ['edit number (null)', { number: null }, null],
                ['edit name & number', { name: 'New name', number: 12 }, null]
            ];
            for (const [testMess, newValues, errorCode] of list) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();
                                const body = {
                                    id,
                                    name: newValues.name,
                                    number: newValues.number
                                };

                                const promise = service.editUser(
                                    id,
                                    newValues.name,
                                    newValues.number
                                );
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.userUpdate,
                                    body,
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });

        describe('removeUser', () => {
            for (const [testMess, errorCode] of testList) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();

                                const promise = service.removeUser(id);
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.userDelete,
                                    { id },
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });
    });
});

function expectTeam(
    service: TeamService,
    httpController: HttpTestingController,
    members?: Types.User[],
    resultMembers?: Types.User[],
    invitation?: string
) {
    const id = 2;
    const name = '2d';
    const assignee = 'Smith';
    service
        .getTeam(id)
        .then((response) =>
            expect(response).toEqual({
                name,
                assignee,
                invitation,
                members: resultMembers
            })
        )
        .catch(() => fail('should resolve'));
    const req = httpController.expectOne(ServerRoutes.team);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({ id });
    req.flush({ name, assignee, invitation, members });
}

function expectTeamModRequest(
    promise: Promise<any>,
    httpController: HttpTestingController,
    route: string,
    body: any,
    errorCode: number | null
) {
    promise
        .then(() => {
            if (errorCode !== null) fail('should be rejected');
        })
        .catch((error) => {
            if (errorCode !== null) expect(error.status).toBe(errorCode);
            else fail('should be resolved');
        });

    const req = httpController.expectOne(route);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(body);
    if (errorCode !== null)
        req.error(new ErrorEvent('Error'), { status: errorCode });
    else req.flush({});
}

/**
 * @returns First - members; Second - sorted members
 */
function getMembers(): [Types.User[], Types.User[]] {
    const members: Types.User[] = [];
    for (let i = 1; i <= 4; i++) {
        members.push({
            id: `User${i}Id`,
            name: `User${i}`,
            number: i % 2 ? 4 - i : null
        });
    }
    const resultMembers = [
        {
            id: 'User3Id',
            name: 'User3',
            number: 1
        },
        {
            id: 'User1Id',
            name: 'User1',
            number: 3
        },
        {
            id: 'User2Id',
            name: 'User2',
            number: null
        },
        {
            id: 'User4Id',
            name: 'User4',
            number: null
        }
    ];
    return [members, resultMembers];
}
