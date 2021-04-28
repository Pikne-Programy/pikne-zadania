// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MongoClient } from "../deps.ts";
import { WorkingDatabase } from "./db/working.ts";
import { Database } from "./db/placeholder.ts";
import { delay, handleThrown, MONGO_CONF, setuproot, userhash } from "./mod.ts";

const client = new MongoClient();
let db: Database;
try {
  // wait for database
  await delay(MONGO_CONF.time);
  await client.connect(MONGO_CONF.url);
  db = new WorkingDatabase(client);
} catch (e) {
  handleThrown(e, "MONGO");
  db = new Database();
}
// create static teams if not already created
if (!db.getTeam(1)) { // teachers' team
  db.addTeam({
    name: "Teachers",
    assignee: "admin",
    members: [],
    invCode: null,
  });
}

await setuproot(
  (dhpassword: string) =>
    db.addUser({
      email: "root",
      name: "root",
      dhpassword,
      team: 0,
      tokens: [],
      seed: 0,
      role: { name: "admin" },
    }),
  () => db.deleteUser(userhash("root")),
);

export { db };
