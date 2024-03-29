import { Account } from 'src/app/account/account.service';
import { TeamItem } from '../team.service/types';
export { INTERNAL_ERROR } from 'src/app/helper/utils';

export const ERROR_MESSAGE = 'Błąd wczytywania danych użytkownika';

export interface DashboardComponentType {
  /**
   * @Input Angular input
   */
  account?: Account;
}

//#region Shortcuts
export const userShortcuts: [string, string, string][] = [
    ['user', '/public-exercises', 'fa-book']
];
export const teacherShortcuts: [string, string, string][] = [
    ['Stwórz nowe zadanie', `/user/subject-select/${encodeURIComponent('/subject/exercise-new')}`, 'fa-plus'],
    ['Zadaj zadanie domowe', '/public-exercises', 'fa-book-open']
];
//#endregion

export class TeacherData {
    constructor(public teams: TeamItem[]) {}
}

export class UserData {
    //TODO User data
    constructor() {}
}
