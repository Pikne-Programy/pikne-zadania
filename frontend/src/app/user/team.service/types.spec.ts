import { isTeam, isTeamItem, isTeamItemList, isUser, User } from './types';

describe('Team types', () => {
    //#region Mocks
    const wrongItem = {
        abc: 'I am trash :P'
    };
    //#region TeamItem
    const id = 1;
    const name = 'Teachers';
    const assignee = 'root';
    const invitation = 'QwErTy';
    const teamItem = {
        id,
        name,
        assignee,
        invitation
    };
    //#endregion
    //#region User
    const userId = 'User1Id';
    const userName = 'User1';
    const user = {
        id: userId,
        name: userName,
        number: 12
    };
    const members: User[] = [];
    for (let i = 0; i < 3; i++) members.push(user);
    //#endregion
    //#endregion

    describe('TeamItem', () => {
        const list: [string, any, boolean][] = [
            ['wrong type', wrongItem, false],
            ['correct', teamItem, true],
            ['correct w/o invitation', { id, name, assignee }, true],
            [
                'correct with invitation null',
                { id, name, assignee, invitation: null },
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
            ['correct w/o invitation', { name, assignee, members }, true],
            ['correct w/o members', { name, assignee, invitation }, true]
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
            [
                'correct w/ number null',
                { id: userId, name: userName, number: null },
                true
            ]
        ];
        for (const [testMess, obj, result] of list) {
            it(`should return ${result} (${testMess})`, () => {
                expect(isUser(obj)).toBe(result);
            });
        }
    });
});
