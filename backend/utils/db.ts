import { IdPartial, Role, Team, User } from "../types/mod.ts";

// JWT
export function addJWT(uid: string, jwt: string) {
}
export function existsJWT(uid: string, jwt: string): boolean {
  return false;
}
export function deleteJWT(uid: string, jwt: string) {
}

// USER
export function addUser(user: User) {
  // overwrite existing user or add new user to db
  // edit team new user is assigned to
}
export function deleteUser(uid: string) {
  // remove User if exists
  // remove it from the team's members
}
export function getUser(uid: string): User | null {
  // get User from db and remove sensitive data
  return null;
}
export function setUser(user: IdPartial<User>) {
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
