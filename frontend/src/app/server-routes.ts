export const publicExerciseList = '/api/public';

//#region Account
export const register = '/api/register';
export const login = '/api/login';
export const logout = '/api/logout';
export const account = '/api/account';
//#endregion

//#region Teams
export const teams = '/api/teams';
export function team(id: number | string): string {
  return `/api/teams/${id}`;
}
export const addTeam = '/api/teams';
export function openTeam(id: number | string): string {
  return `/api/teams/${id}/open`;
}
export function closeTeam(id: number | string): string {
  return `/api/teams/${id}/close`;
}
export function deleteFromTeam(
  userId: number | string,
  teamId: number | string
): string {
  return `/api/teams/${teamId}/${userId}`;
}
export function setUserNumber(
  userId: number | string,
  teamId: number | string
): string {
  return `/api/teams/${teamId}/${userId}`;
}
export function setTeamName(id: number | string): string {
  return `/api/teams/${id}`;
}
export function changeTeamAssignee(id: number | string): string {
  return `/api/root/teams/${id}`;
}
//#endregion

//#region Misc
export function image(subject: string, file: string): string {
  return `/api/public/${subject}/static/${file}`;
}
//#endregion
