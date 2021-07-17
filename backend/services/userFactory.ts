// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOmit, UserType } from "../types/mod.ts";
import {
  IConfig,
  IDatabase,
  ITeamFactory,
  IUserFactory,
} from "../interfaces/mod.ts";
import { lock } from "./mod.ts";
import { User } from "../models/mod.ts";

// TODO: implement proxy
// UserFactory.get(id).getTeam().delete() -- getter w funkcji
// class Proxy<T> {
//   foo?: T;
//   set(x: T) {
//     if (x === undefined) throw new Error("xd");
//     this.foo = x;
//   }
//   get() {
//     if (this.foo === undefined) throw new Error("xd");
//     return this.foo;
//   }
// }

export class UserFactory implements IUserFactory {
  public users: { [key: string]: User } = {};
  public invitations: { [key: string]: number };
  constructor(
    private cfg: IConfig,
    private db: IDatabase,
    private tf: ITeamFactory,
  ) {
    this.invitations = db.invitations;
  }

  @lock()
  async get(id: string, _lock?: symbol) {
    if (this.users[id] === undefined) {
      const user = await this.db.users!.findOne({ id });
      if (!user) return null;
      this.users[user.id] = new User(user, this.db);
    }
    return this.users[id];
  }

  @lock()
  async add(part: IdOmit<UserType>, lock?: symbol) {
    const user = { ...part, id: this.cfg.hash(part.email) };
    if (part.role.name === "admin") {
      this.users[user.id] = new User(user, this.db);
      this.db.promiseQueue.push(
        this.db.users!.updateOne({ id: user.id }, user, { upsert: true }),
      );
    } else {
      if (await this.get(user.id, lock)) return null; // user must not exist
      const team = await this.tf.get(user.team, lock);
      if (!team) return null; // team must exist
      this.db.promiseQueue.push(this.db.users!.insertOne(user));
      team.members.add(user.id);
    }
    this.users[user.id] = new User(user, this.db);
    return user.id;
  }

  @lock()
  async delete(id: string, lock?: symbol) {
    const user = await this.get(id, lock);
    if (!user) return false;
    delete this.users[user.id];
    this.db.promiseQueue.push(this.db.users!.deleteOne({ id: user.id }));
    const team = await this.tf.get(user.team);
    if (team) team.members.remove(user.id);
    return true;
  }
}
