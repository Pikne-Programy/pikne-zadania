import { IdPartial, Role, Team, User } from "../types/mod.ts";
import { userhash } from "../utils/mod.ts";

// JWT
export function addJWT(uid: string, jwt: string) {
}
export function existsJWT(uid: string, jwt: string): boolean {
  return false;
}
export function deleteJWT(uid: string, jwt: string) {
}

// USER
export function addUser(_user: Omit<User, "id">) {
  const user: User = { ..._user, id: userhash(_user.name) };
  // TODO
  // overwrite existing user or add new user to db
  // edit team new user is assigned to
}
export function deleteUser(uid: string) {
  // remove User if exists
  // remove it from the team's members
}
export function getUser(uid: string): User | null {
  // TODO
  return uid==userhash("a@a.a")?{role:"admin",id:userhash("a@a.a"),name:"a@a.a",dhpassword:"$2y$10$HF8dYd/pAmKR8b9rcfu61uyd1fa7wJGYN.QCJhjJLPOxbJVuMkQK2",tokens:[],seed:0}:null;
}
export function setUser(user: Omit<IdPartial<User>, "name">) {
  // ommiting "name" property because we can't change name of User without changing its id
  // overwrite User with properties
  // e.g. change username
}
export function getRole(uid: string): Role {
  return "admin";
}

// INVITATION
export function getInvitation(invCode: string): number | null {
  return null;
}
export function setInvitationCode(tid: number, invCode: string | null) {
}

// TEAMS
export function getAllTeams(): Team[] {
  return [];
}
export function addTeam(team: Omit<Team, "id">): Team["id"] {
  return 0;
}
export function deleteTeam(tid: string) {
}
export function getTeam(tid: number): Team | null {
  return null;
}
export function setTeam(team: IdPartial<Team>) {
}
