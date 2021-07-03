// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GlobalType, IdOptional, IdRequired, TeamType } from "../types/mod.ts";
import { IDatabase, ITeam } from "../interfaces/mod.ts";
import { lock } from "./mod.ts";

class Global { // TODO: remove global
  static defaultGlobal = { lastTid: 1 };

  constructor(
    private db: IDatabase,
  ) {}

  @lock()
  async create(_lock?: symbol): Promise<void> {
    await this.db.global!.insertOne(Global.defaultGlobal);
  }

  @lock()
  async get(lock?: symbol): Promise<GlobalType> {
    const global = await this.db.global!.findOne({});
    if (!global) this.create(lock);
    return global ?? Global.defaultGlobal;
  }

  @lock()
  async nextTid(lock?: symbol): Promise<number> {
    const global = await this.get(lock);
    if (!global) throw new Error("no global collection");
    await this.db.global!.updateOne({}, { $inc: { lastTid: 1 } });
    return global.lastTid + 1;
  }
}

export class Team implements ITeam {
  global: Global;

  constructor(private db: IDatabase) {
    this.global = new Global(db);
  }

  @lock()
  async getAll(_lock?: symbol) {
    return await this.db.teams!.find().toArray();
  }

  @lock()
  async add(_team: IdOptional<TeamType>, lock?: symbol) {
    const team = { ..._team, id: _team.id ?? await this.global.nextTid(lock) };
    await this.db.teams!.insertOne(team);
    return team.id;
  }

  @lock()
  async delete(id: number, lock?: symbol) {
    const team = await this.get(id, lock);
    if (!team) return false;
    for (const uid of team.members) await this.removeUser(team.id, uid, lock);
    await this.db.teams!.deleteOne({ id: team.id });
    return true;
  }

  @lock()
  async get(tid: number, _lock?: symbol) {
    return await this.db.teams!.findOne({ id: tid }) ?? null;
  }

  @lock()
  async set(part: IdRequired<TeamType>, lock?: symbol) {
    if (!await this.get(part.id, lock)) return false;
    await this.db.teams!.updateOne({ id: part.id }, { $set: part });
    return true;
  }

  @lock()
  async removeUser(tid: number, uid: string, lock?: symbol) {
    if (!await this.get(tid, lock)) return false;
    await this.db.teams!.updateOne({ id: tid }, { $pull: { members: uid } });
    return true;
  }

  @lock()
  async addUser(tid: number, uid: string, lock?: symbol) {
    if (!await this.get(tid, lock)) return false;
    await this.db.teams!.updateOne({ id: tid }, { $push: { members: uid } });
    return true;
  }

  @lock()
  async getInvitation(invitation: string, _lock?: symbol) {
    const team = await this.db.teams!.findOne({ invitation: invitation });
    return team ? team.id : null;
  }

  @lock()
  async setInvitationCode(
    id: number,
    invitation: string | null,
    lock?: symbol,
  ) {
    if (!await this.get(id, lock)) return false;
    if (invitation && await this.getInvitation(invitation, lock)) return false;
    await this.db.teams!.updateOne({ id: id }, {
      $set: { invitation: invitation },
    });
    return true;
  }
}
