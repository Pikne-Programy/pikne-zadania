import { isObject } from 'src/app/helper/utils';

type AssigneeType = {
    userId: string;
    name: string;
};
export interface TeamItem {
    teamId: number;
    name: string;
    assignee: AssigneeType;
    invitation?: string | null;
}
export function isTeamItem(object: any): object is TeamItem {
    return (
        isObject<TeamItem>(object, [
            ['teamId', ['number']],
            ['name', ['string']],
            ['assignee', ['object']],
            ['invitation', ['string', 'null', 'undefined']]
        ]) &&
        isObject<AssigneeType>(object.assignee, [
            ['userId', ['string']],
            ['name', ['string']]
        ])
    );
}
export function isTeamItemList(object: any): object is TeamItem[] {
    return Array.isArray(object) && object.every((val) => isTeamItem(val));
}

export interface Team {
    name: string;
    assignee: AssigneeType;
    invitation?: string | null;
    members?: User[];
}
export function isTeam(object: any): object is Team {
    return (
        isObject<Team>(object, [
            ['name', ['string']],
            ['assignee', ['object']],
            ['invitation', ['string', 'null', 'undefined']],
            ['members', 'array|undefined']
        ]) &&
        isObject<AssigneeType>(object.assignee, [
            ['userId', ['string']],
            ['name', ['string']]
        ]) &&
        (!object.members || object.members.every((member) => isUser(member)))
    );
}

export interface User {
    userId: string;
    name: string;
    number: number | null;
}
export function isUser(object: any): object is User {
    return isObject<User>(object, [
        ['userId', ['string']],
        ['name', ['string']],
        ['number', ['number', 'null']]
    ]);
}
