import { Global, IdPartial, success, Team, User } from "../../types/mod.ts";

export class Database {
  constructor() {}
  async close(): Promise<void> {
    return await new Promise((r) => r());
  }
  async getGlobal(): Promise<Global | null> {
    return await new Promise((r) => r(null));
  }
  async addJWT(uid: string, jwt: string): Promise<success> {
    return await new Promise((r) => r(false));
  }
  async existsJWT(uid: string, jwt: string): Promise<boolean> {
    return await new Promise((r) => r(false));
  }
  async deleteJWT(uid: string, jwt: string): Promise<success> {
    return await new Promise((r) => r(false));
  }
  async addUser(part: Omit<User, "id">): Promise<User["id"] | null> {
    return await new Promise((r) => r(null));
  }
  async deleteUser(uid: string): Promise<success> {
    return await new Promise((r) => r(false));
  }
  async getUser(uid: string): Promise<User | null> {
    return await new Promise((r) => r(null));
  }
  async setUser(part: Omit<IdPartial<User>, "email">): Promise<success> {
    return await new Promise((r) => r(false));
  }
  async getInvitation(invCode: string): Promise<number | null> {
    return await new Promise((r) => r(null));
  }
  async setInvitationCode(tid: number, invCode: string | null): Promise<success> {
    return await new Promise((r) => r(false));
  }
  async getAllTeams(): Promise<Team[]> {
    return await new Promise((r) => r([]));
  }
  async addTeam(_team: Omit<Team, "id">): Promise<Team["id"] | null> {
    return await new Promise((r) => r(null));
  }
  async deleteTeam(tid: number): Promise<success> {
    return await new Promise((r) => r(false));
  }
  async getTeam(tid: number): Promise<Team | null> {
    return await new Promise((r) => r(null));
  }
  async setTeam(dif: IdPartial<Team>): Promise<success> {
    return await new Promise((r) => r(false));
  }
}
