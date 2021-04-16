import { Account } from 'src/app/account/account.service';
import { Tuple } from 'src/app/helper/utils';
import { TeamItem } from '../team.service/types';

export const InternalError = 406;
export const ErrorMessage = 'Błąd wczytywania danych użytkownika';

export interface DashboardComponentType {
  /**
   * @Input Angular input
   */
  account?: Account;
}

//#region Shortcuts
export const userShortcuts: Tuple<string, string, string>[] = [
  new Tuple('user', '/public-exercises', 'fa-book'),
];
export const teacherShortcuts: Tuple<string, string, string>[] = [
  new Tuple('teacher', '/public-exercises', 'fa-book'),
];
//#endregion

export class TeacherData {
  constructor(public teams: TeamItem[]) {}
}

export class UserData {
  //TODO User data
  constructor() {}
}
