// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOmit, IdRequired, UserType } from "../types/mod.ts";
import { sha256 } from "../utils/mod.ts";
import { IConfig, IDatabase, ITeam, IUser } from "../interfaces/mod.ts";
import { lock } from "./mod.ts";
import { User } from "../db/mod.ts";

export class UserFactory implements IUser {
  public promiseQueue: (() => unknown)[] = [];
  public users: { [key: string]: User } = {};
  constructor(
    private Icfg: IConfig,
    private Idb: IDatabase,
    private Iteam: ITeam
  ) {
    setInterval(this.awaitPromise, 60 * 1000);
  }

  async awaitPromise() {
    while (this.promiseQueue.length > 0) {
      await (() => this.promiseQueue[0]);
      this.promiseQueue.shift();
    }
  }

  hash(mail: string) {
    return sha256(mail, this.Icfg.USER_SALT);
  }

  @lock()
  async getUser(id: string, lock?: symbol) {
    if (this.users[id] === undefined) {
      const user = await this.get(id, lock);
      if (user) {
        const u = new User(user, this);
        this.users[id] = u;
      } else return null;
    }
    return this.users[id];
  }

  @lock()
  async get(id: string, _lock?: symbol) {
    return (await this.Idb.users!.findOne({ id })) ?? null;
  }

  @lock()
  async add(part: IdOmit<UserType>, lock?: symbol) {
    const user = { ...part, id: this.hash(part.email) };
    if (part.role.name === "admin") {
      await this.Idb.users!.updateOne({ id: user.id }, user, { upsert: true });
    } else {
      if (await this.get(user.id, lock)) return null; // user must not exist
      if (!(await this.Iteam.get(user.team, lock))) return null; // Iteam must exist
      await this.Idb.users!.insertOne(user);
      await this.Iteam.addUser(user.team, user.id, lock);
    }
    return user.id;
  }

  @lock()
  async delete(id: string, lock?: symbol) {
    const user = await this.get(id, lock);
    if (!user) return false;
    if (!(await this.Iteam.get(user.team, lock))) return false;
    await this.Idb.users!.deleteOne({ id: user.id });
    await this.Iteam.removeUser(user.team, user.id, lock);
    return true;
  }

  @lock()
  async set(part: Omit<IdRequired<UserType>, "email">, lock?: symbol) {
    // ommiting "email" property because we can't change email of User without changing its id
    const user = await this.get(part.id, lock);
    if (!user) return false;
    if (part.team && part.team !== user.team) {
      if (!(await this.Iteam.get(part.team, lock))) return false;
      else {
        await this.Iteam.removeUser(user.team, user.id, lock);
        await this.Iteam.addUser(part.team, user.id, lock);
      }
    }
    await this.Idb.users!.updateOne({ id: user.id }, { $set: part });
    return true;
  }

  @lock()
  async addJWT(id: string, jwt: string, lock?: symbol) {
    if (!(await this.get(id, lock))) return false;
    await this.Idb.users!.updateOne({ id: id }, { $addToSet: { tokens: jwt } });
    return true;
  }

  @lock()
  async existsJWT(id: string, jwt: string, lock?: symbol) {
    if (!(await this.get(id, lock))) return false;
    const user = await this.Idb.users!.findOne({
      id: id,
      tokens: { $eq: jwt },
    });
    return user ? true : false;
  }

  @lock()
  async deleteJWT(id: string, jwt: string, lock?: symbol) {
    if (!(await this.get(id, lock))) return false;
    if (!(await this.existsJWT(id, jwt, lock))) return false;
    await this.Idb.users!.updateOne({ id: id }, { $pull: { tokens: jwt } });
    return true;
  }
}
