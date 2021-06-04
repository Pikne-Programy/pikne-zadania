// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MongoClient } from "../../deps.ts";
import { GlobalType, TeamType, UserType } from "../../types/mod.ts";
import { delay, MONGO_CONF, Padlock, setuproot, userhash } from "../mod.ts";
import { Team, User } from "./mod.ts";

const dbLocker = new Padlock();
export function lock<T>() {
  return function (
    _target: T,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      let release = false;
      if (!dbLocker.check(args[args.length - 1])) { // undefined if length < 0
        args.push(await dbLocker.get());
        release = true;
      }
      const result = await originalMethod.apply(this, args);
      if (release) { // undefined if length < 0
        dbLocker.release();
      }
      return result;
    };
  };
}

const client = new MongoClient();
await delay(MONGO_CONF.time); // wait for database
await client.connect(MONGO_CONF.url); // throwable
const _db = client.database(MONGO_CONF.db);

const users = _db.collection<UserType>("users");
const teams = _db.collection<TeamType>("teams");
const global = _db.collection<GlobalType>("global");
export const db = {
  users,
  teams,
  global,
};

export function closeDB() {
  client.close();
}

// create static teachers' team if not already created
if (!await Team.get(1)) { // teachers' team
  await Team.add({
    id: 1,
    name: "Teachers",
    assignee: "root",
    members: [],
    invCode: null,
  });
}

await setuproot(
  (dhpassword: string) =>
    User.add({
      email: "root",
      name: "root",
      dhpassword,
      team: 0,
      tokens: [],
      seed: 0,
      role: { name: "admin" },
    }),
  () => User.delete(userhash("root")),
  () => User.get(userhash("root")),
);
