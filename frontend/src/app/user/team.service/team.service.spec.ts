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
import { ObjectType, TYPE_ERROR } from 'src/app/helper/utils';

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
                    teamId: i,
                    name: `${i}d`,
                    assignee: {
                        userId: 'testUserId',
                        name: 'Smith'
                    }
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
            const teamId = 2;
            const expectedBody = {
                teamId
            };

            it(
                'should throw server error',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();
                            const errorCode = 500;

                            service
                                .getTeam(teamId)
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(errorCode)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.teamInfo
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
                'should throw Type error',
                waitForAsync(
                    inject(
                        [TeamService, HttpClient],
                        (service: TeamService) => {
                            expect(service).toBeTruthy();

                            service
                                .getTeam(teamId)
                                .then(() => fail('should be rejected'))
                                .catch((error) =>
                                    expect(error.status).toBe(TYPE_ERROR)
                                );
                            const req = httpController.expectOne(
                                ServerRoutes.teamInfo
                            );
                            expect(req.request.method).toEqual('POST');
                            expect(req.request.body).toEqual(expectedBody);
                            req.flush({ abc: 'I am trash' });
                        }
                    )
                )
            );

            it(
                'should return Team for not assignee',
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

                            expectTeam(service, httpController, invitation);
                        }
                    )
                )
            );
        });

        describe('getAssigneeList', () => {
            const TEACHER_TEAM_ID = 1;
            const PERMISSION_ERROR = 40003;
            const expectedBody = {
                teamId: TEACHER_TEAM_ID
            };

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
                        assignee: {
                            userId: 'rootId',
                            name: 'root'
                        },
                        members: getMembers(false)[0]
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
                                    ServerRoutes.teamInfo
                                );
                                expect(req.request.method).toEqual('POST');
                                expect(req.request.body).toEqual(expectedBody);
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
                            const [members] = getMembers(true);
                            const result: Types.Team = {
                                name: 'Teachers',
                                assignee: {
                                    userId: 'rootId',
                                    name: 'root'
                                },
                                invitation: null,
                                members
                            };

                            service
                                .getAssigneeList()
                                .then((response) =>
                                    expect(response).toEqual(
                                        members as Types.AssigneeUser[]
                                    )
                                )
                                .catch(() => fail('should resolve'));
                            const req = httpController.expectOne(
                                ServerRoutes.teamInfo
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

    describe('Team modification', () => {
        const teamId = 4;

        describe('createTeam', () => {
            const teamName = 'New Team';

            for (const [testMess, errorCode] of testList) {
                it(`should ${testMess}`, inject(
                    [TeamService, HttpClient],
                    (service: TeamService) => {
                        expect(service).toBeTruthy();

                        const promise = service.createTeam(teamName);
                        expectTeamModRequest(
                            promise,
                            httpController,
                            ServerRoutes.teamCreate,
                            { name: teamName },
                            errorCode,
                            { teamId }
                        );
                    }
                ));
            }

            it('should throw Type error', inject(
                [TeamService, HttpClient],
                (service: TeamService) => {
                    expect(service).toBeTruthy();

                    service
                        .createTeam(teamName)
                        .then(() => fail('should be rejected'))
                        .catch((error) =>
                            expect(error.status).toBe(TYPE_ERROR)
                        );
                    const req = httpController.expectOne(
                        ServerRoutes.teamCreate
                    );
                    expect(req.request.method).toEqual('POST');
                    expect(req.request.body).toEqual({ name: teamName });
                    req.flush({ teamId: teamName });
                }
            ));
        });

        describe('deleteTeam', () => {
            for (const [testMess, errorCode] of testList) {
                it(
                    `should ${testMess}`,
                    waitForAsync(
                        inject(
                            [TeamService, HttpClient],
                            (service: TeamService) => {
                                expect(service).toBeTruthy();

                                const promise = service.deleteTeam(teamId);
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamDelete,
                                    { teamId },
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

                                const promise = service.setTeamName(
                                    teamId,
                                    name
                                );
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { teamId, name },
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
                                const assigneeId = 'User1Id';

                                const promise = service.setAssignee(
                                    teamId,
                                    assigneeId
                                );
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { teamId, assignee: assigneeId },
                                    errorCode
                                );
                            }
                        )
                    )
                );
            }
        });
    });

    describe('Registration', () => {
        const teamId = 4;

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
                                    teamId,
                                    invitation
                                );
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { teamId, invitation },
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

                                const promise = service.closeTeam(teamId);
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.teamUpdate,
                                    { teamId, invitation },
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
        const userId = 'User1Id';

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
                                    userId,
                                    name: newValues.name,
                                    number: newValues.number
                                };

                                const promise = service.editUser(
                                    userId,
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

                                const promise = service.removeUser(userId);
                                expectTeamModRequest(
                                    promise,
                                    httpController,
                                    ServerRoutes.userDelete,
                                    { userId },
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
    invitation?: string
) {
    const teamId = 2;
    const name = '2d';
    const assignee = {
        userId: 'testUserId',
        name: 'Smith'
    };
    const [members, resultMembers] = getMembers(invitation !== undefined);

    service
        .getTeam(teamId)
        .then((response) =>
            expect(response).toEqual({
                name,
                assignee,
                invitation,
                members: resultMembers
            })
        )
        .catch(() => fail('should resolve'));
    const req = httpController.expectOne(ServerRoutes.teamInfo);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({ teamId });
    req.flush({ name, assignee, invitation, members });
}

function expectTeamModRequest(
    promise: Promise<any>,
    httpController: HttpTestingController,
    route: string,
    body: any,
    errorCode: number | null,
    response?: ObjectType
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
    else req.flush(response ? response : {});
}

/**
 * @returns First - members; Second - sorted members
 */
function getMembers(hasIds: boolean): [Types.User[], Types.User[]] {
    const members: Types.User[] = [];
    for (let i = 1; i <= 4; i++) {
        members.push({
            userId: hasIds ? `User${i}Id` : undefined,
            name: `User${i}`,
            number: i % 2 ? 4 - i : null
        });
    }
    const resultMembers: Types.User[] = [
        {
            userId: hasIds ? 'User3Id' : undefined,
            name: 'User3',
            number: 1
        },
        {
            userId: hasIds ? 'User1Id' : undefined,
            name: 'User1',
            number: 3
        },
        {
            userId: hasIds ? 'User2Id' : undefined,
            name: 'User2',
            number: null
        },
        {
            userId: hasIds ? 'User4Id' : undefined,
            name: 'User4',
            number: null
        }
    ];
    return [members, resultMembers];
}
