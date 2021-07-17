// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection, MongoClient } from "../deps.ts";
import { GlobalType, TeamType, UserType } from "../types/mod.ts";
import { delay, Padlock } from "../utils/mod.ts";
import {
  IConfig,
  IDatabase,
  ITeamFactory,
  IUserFactory,
} from "../interfaces/mod.ts";

export function lock<T>() {
  return function (
    _target: T,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      let release = false;
      if (!dbLocker.check(args[args.length - 1])) {
        // undefined if length < 0
        args.push(await dbLocker.get());
        release = true;
      }
      const result = await originalMethod.apply(this, args);
      if (release) {
        // undefined if length < 0
        dbLocker.release();
      }
      return result;
    };
  };
}

const dbLocker = new Padlock();

export class Database implements IDatabase {
  private client?: MongoClient;
  users?: Collection<UserType>;
  teams?: Collection<TeamType>;
  global?: Collection<GlobalType>; // TODO: remove

  public promiseQueue: Promise<unknown>[] = []; // promise
  public invitations: { [key: string]: number } = {};

  constructor(private cfg: IConfig) {}
  closeDB() {
    this.client?.close();
  }

  async init(team: ITeamFactory, user: IUserFactory) {
    this.client = new MongoClient();
    await delay(this.cfg.MONGO_CONF.time); // wait for database
    await this.client.connect(this.cfg.MONGO_CONF.url); // throwable
    const _db = this.client.database(this.cfg.MONGO_CONF.db);

    this.users = _db.collection("users");
    this.teams = _db.collection("teams");
    this.global = _db.collection("global");

    // create static teachers' team if not already created
    if (!(await team.get(1))) {
      // teachers' team
      await team.add({
        id: 1,
        name: "Teachers",
        assignee: "root",
        members: [],
        invitation: null,
      });
    }
    await this.cfg.setuproot(
      (dhpassword: string) =>
        user.add({
          email: "root",
          name: "root",
          dhpassword,
          team: 0,
          tokens: [],
          seed: 0,
          role: { name: "admin" },
        }),
      () => user.delete(this.cfg.hash("root")),
      () => user.get(this.cfg.hash("root")),
    );

    const teams = await this.teams.find().toArray();
    for (const team of teams) {
      if (team.invitation === null) continue;
      this.invitations[team.invitation] = team.id;
    }
  }
  async sync() {
    // TODO: check for errors
    // await Promise.all(this.promiseQueue)
    //   .catch((e) => {
    //     throw new Error(e);
    //   })
    //   .finally(() => {
    //     return;
    //   });
  }
}
