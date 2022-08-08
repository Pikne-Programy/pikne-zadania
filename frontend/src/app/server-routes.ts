//#region Exercise/Problem
export const exerciseList = '/api/subject/hierarchy/get';
export const exerciseGet = '/api/subject/problem/render';
export const exerciseCheck = '/api/subject/problem/submit';
//#endregion

//#region Subject
export const subjectList = '/api/subject/list';
export const subjectCreate = '/api/subject/create';
export const subjectInfo = '/api/subject/info';
export const subjectPermit = '/api/subject/permit';
//#endregion

//#region Hierarchy
export const hierarchyGet = '/api/subject/hierarchy/get';
export const hierarchySet = '/api/subject/hierarchy/set';
//#endregion

//#region Exercise modification
export const subjectExerciseList = '/api/subject/exercise/list';
export const subjectExerciseGet = '/api/subject/exercise/get';
export const subjectExerciseAdd = '/api/subject/exercise/add';
export const subjectExerciseUpdate = '/api/subject/exercise/update';
export const subjectExercisePreview = '/api/subject/exercise/preview';
//#endregion

//#region Authentication
export const register = '/api/auth/register';
export const login = '/api/auth/login';
export const logout = '/api/auth/logout';
//#endregion

//#region User
export const userGet = '/api/user/info';
export const userDelete = '/api/user/delete';
export const userUpdate = '/api/user/update';
export const userInfo = '/api/user/info';
//#endregion

//#region Team
export const teamInfo = '/api/team/info';
export const teamList = '/api/team/list';
export const teamCreate = '/api/team/create';
export const teamDelete = '/api/team/delete';
export const teamUpdate = '/api/team/update';
//#endregion

//#region Group
export const group = '/api/group/info';
export const groupList = '/api/group/list';
export const groupCreate = '/api/group/create';
export const groupDelete = '/api/group/delete';
export const groupUpdate = '/api/group/update';
export const groupJoin = '/api/group/join';
export const groupAddUser = '/api/group/add';
//#endregion

//#region Session
export const sessionReset = '/api/session/reset';
export const sessionAddExercise = '/api/session/add';
export const sessionRemoveExercise = '/api/session/delete';
export const sessionListExercises = '/api/session/list';
export const sessionStatus = '/api/session/status';
export const sessionEnd = '/api/session/end';
//#endregion

//#region Reports
export const reportList = '/api/session/report/list';
export const reportSave = '/api/session/report/save';
export function report(file: string): string {
    return `/api/session/static/${file}`;
}
export const reportDelete = '/api/session/report/delete';
//#endregion

//#region Static files
export const staticList = '/api/subject/static/list';
export function staticFile(subject: string, file: string): string {
    return `/api/subject/static/${subject}/${file}`;
}
//#endregion
