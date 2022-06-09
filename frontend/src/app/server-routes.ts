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

//#region Exam
export const exam = '/api/exam/info';
export const examCreate = '/api/exam/create';
export const examDelete = '/api/exam/delete';
export const examUpdate = '/api/exam/update';
export const examSetExercises = '/api/exam/exercise';
export const examStats = '/api/exam/stats';
export const examUserStats = '/api/exam/user';
export const examRender = '/api/exam/render';
export const examStatic = '/api/exam/static';
export const examClose = '/api/exam/leave';
export const examSubmit = '/api/exam/submit';
//#endregion

//#region Misc
export function staticFile(subject: string, file: string): string {
    return `/api/subject/static/${subject}/${file}`;
}
//#endregion
