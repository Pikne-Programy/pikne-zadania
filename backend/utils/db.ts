// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MongoClient } from "../deps.ts";
import { WorkingDatabase } from "./db/working.ts";
import { Database } from "./db/placeholder.ts";

const client = new MongoClient();
let db: Database;
try {
  await client.connect("mongodb://mongo:27017");
  db = new WorkingDatabase(client);
} catch (e) {
  console.error("MONGO:", e.message, e.stack);
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

export { db };
