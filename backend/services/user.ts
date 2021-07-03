// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOmit, IdRequired, UserType } from "../types/mod.ts";
import { sha256 } from "../utils/mod.ts";
import { IConfig, IDatabase, ITeam, IUser } from "../interfaces/mod.ts";
import { lock } from "./mod.ts";

export class User implements IUser {
  constructor(
    private cfg: IConfig,
    private db: IDatabase,
    private team: ITeam,
  ) {}

  hash(mail: string) {
    return sha256(mail, this.cfg.USER_SALT);
  }

  @lock()
  async get(id: string, _lock?: symbol) {
    return await this.db.users!.findOne({ id }) ?? null;
  }

  @lock()
  async add(part: IdOmit<UserType>, lock?: symbol) {
    const user = { ...part, id: this.hash(part.email) };
    if (part.role.name === "admin") {
      await this.db.users!.updateOne({ id: user.id }, user, { upsert: true });
    } else {
      if (await this.get(user.id, lock)) return null; // user must not exist
      if (!await this.team.get(user.team, lock)) return null; // team must exist
      await this.db.users!.insertOne(user);
      await this.team.addUser(user.team, user.id, lock);
    }
    return user.id;
  }

  @lock()
  async delete(id: string, lock?: symbol) {
    const user = await this.get(id, lock);
    if (!user) return false;
    if (!await this.team.get(user.team, lock)) return false;
    await this.db.users!.deleteOne({ id: user.id });
    await this.team.removeUser(user.team, user.id, lock);
    return true;
  }

  @lock()
  async set(part: Omit<IdRequired<UserType>, "email">, lock?: symbol) {
    // ommiting "email" property because we can't change email of User without changing its id
    const user = await this.get(part.id, lock);
    if (!user) return false;
    if (part.team && part.team !== user.team) {
      if (!await this.team.get(part.team, lock)) return false;
      else {
        await this.team.removeUser(user.team, user.id, lock);
        await this.team.addUser(part.team, user.id, lock);
      }
    }
    await this.db.users!.updateOne({ id: user.id }, { $set: part });
    return true;
  }

  @lock()
  async addJWT(id: string, jwt: string, lock?: symbol) {
    if (!await this.get(id, lock)) return false;
    await this.db.users!.updateOne({ id: id }, { $addToSet: { tokens: jwt } });
    return true;
  }

  @lock()
  async existsJWT(id: string, jwt: string, lock?: symbol) {
    if (!await this.get(id, lock)) return false;
    const user = await this.db.users!.findOne({ id: id, tokens: { $eq: jwt } });
    return user ? true : false;
  }

  @lock()
  async deleteJWT(id: string, jwt: string, lock?: symbol) {
    if (!await this.get(id, lock)) return false;
    if (!await this.existsJWT(id, jwt, lock)) return false;
    await this.db.users!.updateOne({ id: id }, { $pull: { tokens: jwt } });
    return true;
  }
}
