// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GlobalType, IdOptional, TeamType } from "../types/mod.ts";
import { IDatabase, ITeamFactory } from "../interfaces/mod.ts";
import { Team } from "../models/mod.ts";
import { lock } from "./mod.ts";

class Global {
  // TODO: remove global
  static defaultGlobal = { lastTid: 1 };

  constructor(private db: IDatabase) {}

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

export class TeamFactory implements ITeamFactory {
  readonly teams: Team[] = [];
  global: Global;

  constructor(private db: IDatabase) {
    this.global = new Global(db);
  }

  @lock()
  async getAll(lock?: symbol) {
    const dbTeams = await this.db.teams!.find().toArray();
    const teams = await Promise.all(
      dbTeams.map((team) => this.get(team.id, lock)),
    );
    return teams.filter(<(t: Team | null) => t is Team> ((t) => t !== null));
  }
  @lock()
  async get(id: number, _lock?: symbol) {
    if (this.teams[id] === undefined) {
      const dbTeam = await this.db.teams!.findOne({ id });
      if (!dbTeam) return null;
      const team = new Team(dbTeam, this.db);
      this.teams[id] = team;
    }
    return this.teams[id];
  }
  @lock()
  async add(_team: IdOptional<TeamType>, lock?: symbol) {
    const team = {
      ..._team,
      id: _team.id ?? (await this.global.nextTid(lock)),
    };
    this.teams[team.id] = new Team(team, this.db);
    this.db.promiseQueue.push(this.db.teams!.insertOne(team));
    return team.id;
  }

  @lock()
  async delete(id: number, lock?: symbol) {
    const team = await this.get(id, lock);
    if (!team) return false;
    for (const uid of team.members.get()) await team.members.remove(uid);
    delete this.teams[team.id];
    this.db.promiseQueue.push(this.db.teams!.deleteOne({ id: team.id }));
    return true;
  }

  async getInvitation(inv: string) {
    const team = await this.db.teams!.findOne({ invitation: inv });
    if (!team) return null;
    return team.id;
  }
}
