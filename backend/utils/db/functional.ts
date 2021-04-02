// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection, MongoClient } from "../../deps.ts";
import { Global, IdPartial, success, Team, User } from "../../types/mod.ts";
import { userhash } from "../../utils/mod.ts";
import { Database } from "./placeholder.ts";

export class FunctionalDatabase extends Database {
  readonly users: Collection<User>;
  readonly teams: Collection<Team>;
  readonly global: Collection<Global>;

  static readonly defaultGlobal: Readonly<Global> = { lastTid: 0 };

  constructor(readonly client: MongoClient) {
    super();
    const db = this.client.database("pikne-zadania");
    this.users = db.collection<User>("users");
    this.teams = db.collection<Team>("teams");
    this.global = db.collection<Global>("global");
  }
  async close() {
    await this.client.close();
  }

  // GLOBAL
  async getGlobal(): Promise<Global> {
    const global = await this.global.findOne({});
    if (!global) {
      console.error("No global collection in database");
      const _global = FunctionalDatabase.defaultGlobal;
      await this.global.insertOne(_global);
      return _global;
    }
    return global;
  }

  // JWT
  async addJWT(uid: string, jwt: string): Promise<success> {
    if (!await this.getUser(uid)) {
      console.error(`addJWT: no user with id ${uid}`);
      return false;
    }
    await this.users.updateOne({ id: uid }, { $addToSet: { tokens: jwt } });
    return true;
  }

  async existsJWT(uid: string, jwt: string): Promise<boolean> {
    if (!await this.getUser(uid)) {
      console.error(`existsJWT: no user with id ${uid}`);
      return false;
    }
    const user = await this.users.findOne({ id: uid, tokens: { $eq: jwt } });
    return user ? true : false;
  }

  async deleteJWT(uid: string, jwt: string): Promise<success> {
    if (!await this.getUser(uid)) {
      console.error(`deleteJWT: no user with id ${uid}`);
      return false;
    }
    if (!await this.existsJWT(uid, jwt)) {
      console.error(`deleteJWT: jwt not in user; id ${uid}; jwt ${jwt}`);
      return false;
    }
    await this.users.updateOne({ id: uid }, { $pull: { tokens: jwt } });
    return true;
  }

  // USER
  async addUser(part: Omit<User, "id">): Promise<User["id"] | null> {
    const user = { ...part, id: userhash(part.email) };
    if (part.role.name === "admin") {
      await this.users.updateOne({ id: user.id }, user, { upsert: true });
    } else {
      if (await this.getUser(user.id)) {
        console.error(`addUser: user already exists; id ${user.id}`);
        return null;
      }
      if (!await this.getTeam(user.team)) {
        console.error(`addUser: no team with id ${user.team}`);
        return null;
      }
      await this.teams.updateOne({ id: user.team }, { $push: { members: user.id } });
      await this.users.insertOne(user);
    }
    return user.id;
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

  async getUser(uid: string): Promise<User | null> {
    const user = await this.users.findOne({ id: uid });
    return user ?? null;
  }

  async setUser(part: Omit<IdPartial<User>, "email">): Promise<success> {
    // ommiting "email" property because we can't change email of User without changing its id
    const user = await this.getUser(part.id);
    if (!user) {
      console.error(`setUser: no user with id ${part.id}`);
      return false;
    }
    if (part.team && part.team !== user.team) {
      if (!await this.getTeam(part.team)) {
        console.error(`setUser: no team with id${part.team}}`);
      } else {
        //remove user from previous team
        await this.teams.updateOne({ id: user.team }, {
          $pull: { members: user.id },
        });
        await this.teams.updateOne({ id: part.team }, {
          $push: { members: part.id },
        });
      }
    }
    await this.users.updateOne({ id: user.id }, { $set: part });
    return true;
  }

  // INVITATION
  async getInvitation(invCode: string): Promise<number | null> {
    const team = await this.teams.findOne({ invCode: invCode });
    return team ? team.id : null;
  }

  async setInvitationCode(
    tid: number,
    invCode: string | null,
  ): Promise<success> {
    if (!await this.getTeam(tid)) {
      console.error(`setInvitationCode: no team with id ${tid}`);
      return false;
    }
    if (invCode && await this.getInvitation(invCode)) {
      console.error(`setInvitationCode: invitation code alredy existsts; invCode ${invCode}`);
      return false;
    }
    await this.teams.updateOne({ id: tid }, { $set: { invCode: invCode } });
    return true;
  }

  // TEAMS
  async getAllTeams(): Promise<Team[]> {
    return await this.teams.find().toArray();
  }
  async addTeam(_team: Omit<Team, "id">): Promise<Team["id"] | null> {
    const global = await this.getGlobal();
    if (!global) {
      console.error("addTeam: no global collection");
      return null;
    }
    const team: Team = { ..._team, id: global.lastTid + 1 };
    await this.global.updateOne({}, { $inc: { lastTid: 1 } });
    await this.teams.insertOne(team);
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
      return false;
    }
    await this.teams.updateOne({ id: part.id }, { $set: part });
    return true;
  }
}
