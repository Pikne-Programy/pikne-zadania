// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOmit, IdRequired, success, UserType } from "../../types/mod.ts";
import { userhash } from "../mod.ts";
import { db, lock, Team } from "./mod.ts";

export abstract class User {
  @lock()
  static async get(id: string, _lock?: symbol): Promise<UserType | null> {
    return await db.users.findOne({ id }) ?? null;
  }
  @lock()
  static async add(
    part: IdOmit<UserType>,
    lock?: symbol,
  ): Promise<UserType["id"] | null> {
    const user = { ...part, id: userhash(part.email) };
    if (part.role.name === "admin") {
      await db.users.updateOne({ id: user.id }, user, { upsert: true });
    } else {
      if (await User.get(user.id, lock)) return null; // user must not exist
      if (!await Team.get(user.team, lock)) return null; // team must exist
      await db.users.insertOne(user);
      await Team.addUser(user.team, user.id, lock);
    }
    return user.id;
  }
  @lock()
  static async delete(id: UserType["id"], lock?: symbol): Promise<success> {
    const user = await User.get(id, lock);
    if (!user) return false;
    if (!await Team.get(user.team, lock)) return false;
    await db.users.deleteOne({ id: user.id });
    await Team.removeUser(user.team, user.id, lock);
    return true;
  }
  @lock()
  static async set(
    part: Omit<IdRequired<UserType>, "email">,
    lock?: symbol,
  ): Promise<success> {
    // ommiting "email" property because we can't change email of User without changing its id
    const user = await User.get(part.id, lock);
    if (!user) return false;
    if (part.team && part.team !== user.team) {
      if (!await Team.get(part.team, lock)) return false;
      else {
        await Team.removeUser(user.team, user.id, lock);
        await Team.addUser(part.team, user.id, lock);
      }
    }
    await db.users.updateOne({ id: user.id }, { $set: part });
    return true;
  }
  @lock()
  static async addJWT(
    id: UserType["id"],
    jwt: UserType["tokens"][0],
    lock?: symbol,
  ): Promise<success> {
    if (!await User.get(id, lock)) return false;
    await db.users.updateOne({ id: id }, { $addToSet: { tokens: jwt } });
    return true;
  }
  @lock()
  static async existsJWT(
    id: UserType["id"],
    jwt: UserType["tokens"][0],
    lock?: symbol,
  ): Promise<boolean> {
    if (!await User.get(id, lock)) return false;
    const user = await db.users.findOne({ id: id, tokens: { $eq: jwt } });
    return user ? true : false;
  }
  @lock()
  static async deleteJWT(
    id: UserType["id"],
    jwt: UserType["tokens"][0],
    lock?: symbol,
  ): Promise<success> {
    if (!await User.get(id, lock)) return false;
    if (!await User.existsJWT(id, jwt, lock)) return false;
    await db.users.updateOne({ id: id }, { $pull: { tokens: jwt } });
    return true;
  }
}
