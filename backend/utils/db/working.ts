import { MongoClient, Mutex } from "../../deps.ts";
import { Global, IdPartial, success, Team, User } from "../../types/mod.ts";
import { FunctionalDatabase } from "./functional.ts";

const mutex = new Mutex();

function lock() {
  return function (
    target: WorkingDatabase,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      return await mutex.runExclusive(async () => {
        const result = await originalMethod.apply(this, args);
        return result;
      });
    };
  };
}

export class WorkingDatabase {
  readonly db: FunctionalDatabase;

  constructor(client: MongoClient) {
    this.db = new FunctionalDatabase(client);
  }

  @lock()
  async close(): Promise<void> {
    return await this.db.close();
  }
  @lock()
  async getGlobal(): Promise<Global> {
    return await this.db.getGlobal();
  }
  @lock()
  async addJWT(uid: string, jwt: string): Promise<success> {
    return await this.db.addJWT(uid, jwt);
  }
  @lock()
  async existsJWT(uid: string, jwt: string): Promise<boolean> {
    return await this.db.existsJWT(uid, jwt);
  }
  @lock()
  async deleteJWT(uid: string, jwt: string): Promise<success> {
    return await this.db.deleteJWT(uid, jwt);
  }
  @lock()
  async addUser(part: Omit<User, "id">): Promise<User["id"] | null> {
    return await this.db.addUser(part);
  }
  @lock()
  async deleteUser(uid: string): Promise<success> {
    return await this.db.deleteUser(uid);
  }
  @lock()
  async getUser(uid: string): Promise<User | null> {
    return await this.db.getUser(uid);
  }
  @lock()
  async setUser(part: Omit<IdPartial<User>, "email">): Promise<success> {
    return await this.db.setUser(part);
  }
  @lock()
  async getInvitation(invCode: string): Promise<number | null> {
    return await this.db.getInvitation(invCode);
  }
  @lock()
  async setInvitationCode(
    tid: number,
    invCode: string | null,
  ): Promise<boolean> {
    return await this.db.setInvitationCode(tid, invCode);
  }
  @lock()
  async getAllTeams(): Promise<Team[]> {
    return await this.db.getAllTeams();
  }
  @lock()
  async addTeam(_team: Omit<Team, "id">): Promise<Team["id"] | null> {
    return await this.db.addTeam(_team);
  }
  @lock()
  async deleteTeam(tid: number): Promise<success> {
    return await this.db.deleteTeam(tid);
  }
  @lock()
  async getTeam(tid: number): Promise<Team | null> {
    return await this.db.getTeam(tid);
  }
  @lock()
  async setTeam(part: IdPartial<Team>): Promise<success> {
    return await this.db.setTeam(part);
  }
}
