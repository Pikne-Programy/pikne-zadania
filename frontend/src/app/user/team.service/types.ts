export interface TeamItem {
  id: number;
  name: string;
  assignee?: string;
  open: boolean;
}
export function isTeamItem(object: any): object is TeamItem {
  return (
    typeof object === 'object' &&
    'id' in object &&
    'name' in object &&
    'open' in object
  );
}
export function isTeamItemList(object: any): object is TeamItem[] {
  return Array.isArray(object) && object.every((val) => isTeamItem(val));
}

export interface Team {
  name: string;
  assignee?: string;
  invitation: string | null;
  members: User[];
}
export function isTeam(object: any): object is Team {
  return (
    typeof object === 'object' &&
    'name' in object &&
    'invitation' in object &&
    'members' in object &&
    Array.isArray(object.members) &&
    (object.members as any[]).every((val) => isUser(val))
  );
}

export interface User {
  id: string;
  name: string;
  number: number | null;
}
export function isUser(object: any): object is User {
  return (
    typeof object === 'object' &&
    'id' in object &&
    'name' in object &&
    'number' in object
  );
}
