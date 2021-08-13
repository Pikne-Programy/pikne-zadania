import { Account } from 'src/app/account/account.service';
import { TeamItem } from '../team.service/types';

export const InternalError = 480;
export const ErrorMessage = 'Błąd wczytywania danych użytkownika';

export interface DashboardComponentType {
  /**
   * @Input Angular input
   */
  account?: Account;
}

//#region Shortcuts
export const userShortcuts: [string, string, string][] = [
  ['user', '/public-exercises', 'fa-book'],
];
export const teacherShortcuts: [string, string, string][] = [
  ['teacher', '/public-exercises', 'fa-book'],
];
//#endregion

export class TeacherData {
  constructor(public teams: TeamItem[]) {}
}

export class UserData {
  //TODO User data
  constructor() {}
}
