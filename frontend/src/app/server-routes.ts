//#region Exercise
export const exerciseList = '/api/exercise/list';
export const exerciseCheck = '/api/exercise/check';
export const exerciseRender = '/api/exercise/render';
//#endregion

//#region Subject
export const subjectList = '/api/subject/list';
export const subjectCreate = '/api/subject/create';
export const subjectInfo = '/api/subject/info';
export const subjectPermit = '/api/subject/permit';

// Exercise modification
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
export const user = '/api/user/current';
export const userDelete = '/api/user/delete';
export const userUpdate = '/api/user/update';
export const userInfo = '/api/user/info';
//#endregion

//#region Team
export const team = '/api/team/info';
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
export function image(subject: string, file: string): string {
    return `/img/${subject}/${file}`;
}
//#endregion
