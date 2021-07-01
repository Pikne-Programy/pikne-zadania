// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db, Global, lock } from "./mod.ts";
import {
  IdOptional,
  IdRequired,
  success,
  TeamType,
  UserType,
} from "../../types/mod.ts";

export abstract class Team {
  @lock()
  static async getAll(_lock?: symbol): Promise<TeamType[]> {
    return await db.teams.find().toArray();
  }
  @lock()
  static async add(
    _team: IdOptional<TeamType>,
    lock?: symbol,
  ): Promise<TeamType["id"] | null> {
    const team = { ..._team, id: _team.id ?? await Global.nextTid(lock) };
    await db.teams.insertOne(team);
    return team.id;
  }
  @lock()
  static async delete(id: number, lock?: symbol): Promise<success> {
    const team = await Team.get(id, lock);
    if (!team) return false;
    for (const uid of team.members) await Team.removeUser(team.id, uid, lock);
    await db.teams.deleteOne({ id: team.id });
    return true;
  }
  @lock()
  static async get(tid: number, _lock?: symbol): Promise<TeamType | null> {
    return await db.teams.findOne({ id: tid }) ?? null;
  }
  @lock()
  static async set(
    part: IdRequired<TeamType>,
    lock?: symbol,
  ): Promise<success> {
    if (!await Team.get(part.id, lock)) return false;
    await db.teams.updateOne({ id: part.id }, { $set: part });
    return true;
  }
  @lock()
  static async removeUser(
    tid: TeamType["id"],
    uid: UserType["id"],
    lock?: symbol,
  ): Promise<success> {
    if (!await Team.get(tid, lock)) return false;
    await db.teams.updateOne({ id: tid }, { $pull: { members: uid } });
    return true;
  }
  @lock()
  static async addUser(
    tid: TeamType["id"],
    uid: UserType["id"],
    lock?: symbol,
  ): Promise<success> {
    if (!await Team.get(tid, lock)) return false;
    await db.teams.updateOne({ id: tid }, { $push: { members: uid } });
    return true;
  }
  @lock()
  static async getInvitation(
    invitation: TeamType["invitation"],
    _lock?: symbol,
  ): Promise<number | null> {
    const team = await db.teams.findOne({ invitation: invitation });
    return team ? team.id : null;
  }
  @lock()
  static async setInvitationCode(
    id: TeamType["id"],
    invitation: TeamType["invitation"] | null,
    lock?: symbol,
  ): Promise<success> {
    if (!await Team.get(id, lock)) return false;
    if (invitation && await this.getInvitation(invitation, lock)) return false;
    await db.teams.updateOne({ id: id }, { $set: { invitation: invitation } });
    return true;
  }
}
