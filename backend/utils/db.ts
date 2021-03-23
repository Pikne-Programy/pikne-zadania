import { Bson as Bison, Collection, MongoClient } from "../deps.ts";
import { IdPartial, Team, Users } from "../types/mod.ts";
import { userhash } from "../utils/mod.ts";
import { Database } from "./db_template.ts";

// console.log(Bison); // Tue, 23 Mar 2021 01:17:24 +0100

// TODO
// locking database inside functions

type success = boolean;
interface Global {
  lastTid: number;
}
class WorkingDatabase extends Database {
  readonly users: Collection<Users>;
  readonly teams: Collection<Team>;
  readonly global: Collection<Global>;

  constructor(readonly client: MongoClient) {
    super();
    const db = this.client.database("pikne-zadania");
    this.users = db.collection<Users>("users");
    this.teams = db.collection<Team>("teams");
    this.global = db.collection<Global>("global");
  }
  async close() {
    await this.client.close();
  }

  // JWT
  async addJWT(uid: string, jwt: string): Promise<success> {
    // TODO
    return await new Promise((r) => r(true));
  }

  async existsJWT(uid: string, jwt: string): Promise<boolean> {
    // TODO
    return await new Promise((r) => r(true));
  }

  async deleteJWT(uid: string, jwt: string): Promise<success> {
    // TODO
    return await new Promise((r) => r(true));
  }

  // USER
  async addUser(part: Omit<Users, "id">): Promise<success> {    
    const user = { ...part, id: userhash(part.email) };
    if (await this.getUser(user.id)) {
      console.error(`addUser: user already exists; id ${user.id}`);
      return false;
    }
    await this.teams.updateOne({ id: user.team }, {
      $push: { members: user.id },
    });
    await this.users.updateOne({ id: user.id }, user, { upsert: true });
    return true;
  }

  async deleteUser(uid: string): Promise<success> {
    const user = await this.getUser(uid);
    if (!user) {
      console.error(`deleteUser: no user with id ${uid}`);
      return false;
    }
    if (!await this.getTeam(user.team)) {
      console.error(`deleteUser: no team with id ${user.team}}`);
    } else {
      //remove user from its team
      await this.teams.updateOne({ id: user.team }, {
        $pull: { members: uid },
      });
    }
    await this.users.deleteOne({ id: user.id });
    return true;
  }

  async getUser(uid: string): Promise<Users | null> {
    const user = await this.users.findOne({ id: uid });
    return user ?? null;
  }

  async setUser(part: Omit<IdPartial<Users>, "email">): Promise<success> {
    // ommiting "email" property because we can't change email of User without changing its id
    const user = await this.getUser(part.id);
    if (!user) {
      console.error(`setUser: no user with id ${part.id}`);
      return false;
    }
    if (part.team && part.team !== user.team) {
      if (!await this.getTeam(part.team)) {
        console.error(`setUser: no previous team with id${part.team}}`);
      } else {
        //remove user from previous team
        await this.teams.updateOne({ id: user.team }, {
          $pull: { members: user.id },
        });
      }
    }
    if (part.team && part.team !== user.team) {
      await this.teams.updateOne({ id: part.team }, {
        $push: { members: part.id },
      });
    }
    await this.users.updateOne({ id: user.id }, { $set: part });
    return true;
  }

  // INVITATION
  async getInvitation(invCode: string): Promise<number | null> {
    // TODO
    return await new Promise((r) => r(null));
  }

  async setInvitationCode(
    tid: number,
    invCode: string | null,
  ): Promise<success> {
    // TODO
    return await new Promise((r) => r(true));
  }

  // TEAMS
  async getAllTeams(): Promise<Team[]> {
    return await this.teams.find().toArray();
  }
  async addTeam(_team: Omit<Team, "id">): Promise<Team["id"]|null> {
    const _global = await this.global.findOne();
    if (!_global) {
      console.error("addTeam: no global collection");
      return null;
    }
    const team: Team = { ..._team, id: _global.lastTid + 1 };
    await this.global.updateOne({}, { $inc: { lastTid: 1 } });
    await this.teams.updateOne({ id: team.id }, team, { upsert: true });
    return team.id;
  }

  async deleteTeam(tid: number): Promise<success> {
    const team = await this.getTeam(tid);
    if (!team) {
      console.error(`deleteTeam: no team with id ${tid}`);
      return false;
    }
    for (const uid of team.members) {
      await this.deleteUser(uid);
    }
    await this.teams.deleteOne({ id: team.id });
    return true;
  }

  async getTeam(tid: number): Promise<Team | null> {
    const team = await this.teams.findOne({ id: tid });
    return team ?? null;
  }

  async setTeam(part: IdPartial<Team>): Promise<success> {
    if (!await this.getTeam(part.id)) {
      console.log(`setTeam: no team with id ${part.id}`);
      return false;
    }
    await this.teams.updateOne({ id: part.id }, { $set: part });
    return true;
  }
}

const client = new MongoClient();
let db: Database;
try {
  await client.connect("mongodb://mongo:27017");
  db = new WorkingDatabase(client);
} catch (e) {
  console.error("MONGO:", e.message, e.stack);
  db = new Database();
}
export { db };
