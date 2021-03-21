import { IdPartial, Role, Team, User } from "../types/mod.ts";
import { userhash } from "../utils/mod.ts";

// JWT
export function addJWT(uid: string, jwt: string) {
  // TODO
}
export function existsJWT(uid: string, jwt: string): boolean {
  // TODO
  return false;
}
export function deleteJWT(uid: string, jwt: string) {
  // TODO
}

// USER
export function addUser(_user: Omit<User, "id">) {
  const user: User = { ..._user, id: userhash(_user.name) };
  // TODO
  // overwrite existing user or add new user to db
  // edit team new user is assigned to
}
export function deleteUser(uid: string) {
  // TODO
  // remove User if exists
  // remove it from the team's members
}
export function getUser(uid: string): User | null {
  // TODO
  return uid==userhash("a@a.a")?{role:"admin",id:userhash("a@a.a"),name:"a@a.a",dhpassword:"$2y$10$HF8dYd/pAmKR8b9rcfu61uyd1fa7wJGYN.QCJhjJLPOxbJVuMkQK2",tokens:[],seed:0}:null;
}
export function setUser(user: Omit<IdPartial<User>, "name">) {
  // TODO
  // ommiting "name" property because we can't change name of User without changing its id
  // overwrite User with properties
  // e.g. change username
}
export function getRole(uid: string): Role {
  // TODO
  return "admin";
}

// INVITATION
export function getInvitation(invCode: string): number | null {
  // TODO
  return null;
}
export function setInvitationCode(tid: number, invCode: string | null) {
  // TODO
}

// TEAMS
export function getAllTeams(): Team[] {
  // TODO
  return [];
}
export function addTeam(team: Omit<Team, "id">): Team["id"] {
  // TODO
  return 0;
}
export function deleteTeam(tid: string) {
  // TODO
}
export function getTeam(tid: number): Team | null {
  // TODO
  return null;
}
export function setTeam(team: IdPartial<Team>) {
  // TODO
}
