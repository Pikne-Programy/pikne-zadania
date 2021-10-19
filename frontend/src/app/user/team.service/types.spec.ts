import {
    AssigneeUser,
    isAssigneeList,
    isTeam,
    isTeamItem,
    isTeamItemList,
    isUser,
    User
} from './types';

describe('Team types', () => {
    //#region Mocks
    const wrongItem = {
        abc: 'I am trash :P'
    };
    //#region TeamItem
    const teamId = 1;
    const name = 'Teachers';
    const assignee = {
        name: 'root'
    };
    const assigneeWithId = {
        userId: 'rootId',
        name: 'root'
    };
    const invitation = 'QwErTy';
    const teamItem = {
        teamId,
        name,
        assignee,
        invitation
    };
    //#endregion
    //#region User
    const userId = 'User1Id';
    const userName = 'User1';
    const user = {
        name: userName,
        number: 12
    };
    const userWithId = {
        userId,
        name: userName,
        number: 12
    };
    const members: User[] = [];
    for (let i = 0; i < 3; i++) members.push(user);
    const assignees: AssigneeUser[] = [];
    for (let i = 0; i < 3; i++) members.push(userWithId);
    //#endregion
    //#endregion

    describe('TeamItem', () => {
        const list: [string, any, boolean][] = [
            ['wrong type', wrongItem, false],
            ['correct', teamItem, true],
            [
                'correct w/ assignee w/ id',
                { teamId, name, assignee: assigneeWithId },
                true
            ],
            ['correct w/o invitation', { teamId, name, assignee }, true],
            [
                'correct with invitation null',
                { teamId, name, assignee, invitation: null },
                true
            ]
        ];
        for (const [testMess, obj, result] of list) {
            it(`should return ${result} (${testMess})`, () => {
                expect(isTeamItem(obj)).toBe(result);
            });
        }
    });

    describe('TeamItemList', () => {
        const list: [string, any, boolean][] = [
            ['not an array', teamItem, false],
            ['wrong item type', [wrongItem, teamItem], false],
            ['correct', [teamItem, teamItem, teamItem], true]
        ];
        for (const [testMess, obj, result] of list) {
            it(`should return ${result} (${testMess})`, () => {
                expect(isTeamItemList(obj)).toBe(result);
            });
        }
    });

    describe('Team', () => {
        const list: [string, any, boolean][] = [
            ['wrong type', wrongItem, false],
            [
                'members not an array',
                { name, assignee, invitation, members: user },
                false
            ],
            [
                `wrong members' item type`,
                { name, assignee, invitation, members: [wrongItem, user] },
                false
            ],
            ['correct', { name, assignee, invitation, members }, true],
            [
                'correct w/ assignee w/ id',
                { name, assignee: assigneeWithId, invitation, members },
                true
            ],
            ['correct w/o invitation', { name, assignee, members }, true]
        ];
        for (const [testMess, obj, result] of list) {
            it(`should return ${result} (${testMess})`, () => {
                expect(isTeam(obj)).toBe(result);
            });
        }
    });

    describe('User', () => {
        const list: [string, any, boolean][] = [
            ['wrong type', wrongItem, false],
            ['correct', user, true],
            ['correct w/ id', userWithId, true],
            ['correct w/ number null', { name: userName, number: null }, true]
        ];
        for (const [testMess, obj, result] of list) {
            it(`should return ${result} (${testMess})`, () => {
                expect(isUser(obj)).toBe(result);
            });
        }
    });

    describe('AssigneeUser', () => {
        it('should return false', () => {
            expect(isAssigneeList(members)).toBeFalse();
            expect(isAssigneeList([userWithId, user]))
                .withContext('mixed list')
                .toBeFalse();
        });

        it('should return true', () => {
            expect(isAssigneeList(assignees)).toBeTrue();
        });
    });
});
