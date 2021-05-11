import { isObject } from 'src/app/helper/utils';

export interface TeamItem {
  id: number;
  name: string;
  assignee?: string;
  open: boolean;
}
export function isTeamItem(object: any): object is TeamItem {
  return isObject<TeamItem>(object, [
    ['id', ['number']],
    ['name', ['string']],
    ['assignee', ['string', 'undefined']],
    ['open', ['boolean']],
  ]);
}
export function isTeamItemList(object: any): object is TeamItem[] {
  return Array.isArray(object) && object.every((val) => isTeamItem(val));
}

export interface Team {
  name: string;
  assignee: string;
  invitation: string | null;
  members: User[];
}
export function isTeam(object: any): object is Team {
  return (
    isObject<Team>(object, [
      ['name', ['string']],
      ['assignee', ['string']],
      ['invitation', ['string', 'null']],
      ['members', 'array'],
    ]) && object.members.every((member) => isUser(member))
  );
}

export interface User {
  id: string;
  name: string;
  number: number | null;
}
export function isUser(object: any): object is User {
  return isObject<User>(object, [
    ['id', ['string']],
    ['name', ['string']],
    ['number', ['number', 'null']],
  ]);
}
