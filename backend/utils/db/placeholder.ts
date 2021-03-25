import { IdPartial, Team, Users, success } from "../../types/mod.ts";

export class Database {
  constructor() {}
  async close(): Promise<void> {
    return await new Promise((r) => r());
  }
  async resetGlobal(): Promise<void> {
    return await new Promise((r) => r());
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
  async addUser(part: Omit<Users, "id">): Promise<Users["id"] | null> {
    return await new Promise((r) => r(null));
  }
  async deleteUser(uid: string): Promise<success> {
    return await new Promise((r) => r(false));
  }
  async getUser(uid: string): Promise<Users | null> {
    return await new Promise((r) => r(null));
  }
  async setUser(part: Omit<IdPartial<Users>, "email">): Promise<success> {
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
