// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UserType } from "../types/mod.ts";
import {
  IConfigService,
  IDatabaseService,
  ITeamStore,
  IUserStore,
} from "../interfaces/mod.ts";
import { User } from "../models/mod.ts";
import { firsthash, secondhashSync } from "../utils/mod.ts";

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

export class UserStore implements IUserStore {
  constructor(
    private cfg: IConfigService,
    private db: IDatabaseService,
    private ts: ITeamStore
  ) {}

  async init() {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE."
    ) => console.warn(`WARN: ${what} is present. ${why}`);
    const root = await this.get(this.cfg.hash("root"));
    const rootType = {
      login: "root",
      name: "root",
      team: 0,
      tokens: [],
      seed: 0,
      role: { name: "admin" },
    };
    const config = this.cfg.ROOT_CONF;
    if (!config.enable) {
      if (config.password) warn("ROOT_PASS");
      if (config.dhPassword) warn("ROOT_DHPASS");
      if (root) await this.delete(this.cfg.hash("root"));
      return;
    }
    warn("ROOT_ENABLE", "It can be a security issue.");
    if (config.dhPassword) {
      if (config.password) warn("ROOT_PASS");
      if (root && root.dhpassword == config.dhPassword) {
        console.log("ROOT was not changed.");
      } else {
        await this.add(
          { invitation: "" },
          {
            dhPassword: config.dhPassword,
            ...rootType,
          }
        );
        console.warn("ROOT was registered with ROOT_DHPASS.");
      }
    } else {
      if (!(config.password || root)) {
        throw new Error("no credentials for root");
      }
      if (config.password) {
        console.log(new Date(), "Generating root password hash...");
        const dhPassword = secondhashSync(firsthash("root", config.password));
        console.log(new Date(), "Generated!");
        console.warn(`Please unset ROOT_PASS!`);
        console.warn(`Set ROOT_DHPASS=${dhPassword} if needed.`);
        await this.add({ invitation: "" }, { dhPassword, ...rootType });
        console.warn("ROOT was registered with ROOT_PASS.");
      }
    }
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
        this.db.users!.updateOne({ id: user.id }, user, { upsert: true })
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
