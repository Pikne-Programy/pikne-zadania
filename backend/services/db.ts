// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection, MongoClient } from "../deps.ts";
import { delay } from "../utils/mod.ts";
import { SubjectType, TeamType, UserType } from "../types/mod.ts";
import { IConfigService, IDatabaseService } from "../interfaces/mod.ts";

export class Database implements IDatabaseService {
  private client?: MongoClient;
  users?: Collection<UserType>;
  teams?: Collection<TeamType>;
  subjects?: Collection<SubjectType>;

  constructor(
    private cfg: IConfigService,
  ) {}

  async connect() {
    this.client = new MongoClient();
    await delay(this.cfg.MONGO_CONF.time); // wait for database
    await this.client.connect(this.cfg.MONGO_CONF.url); // throwable
    const db = this.client.database(this.cfg.MONGO_CONF.db);

    this.users = db.collection("users");
    this.teams = db.collection("teams");
    this.subjects = db.collection("subjects");

    if (this.cfg.FRESH) await this.drop();
  }

  close() {
    this.client?.close();
  }

  async drop() {
    function filterUseless(e: unknown) {
      if (!(e instanceof Error) || !/"NamespaceNotFound"/.test(e.message)) {
        throw e;
      }
    }
    await this.users!.drop().catch(filterUseless);
    await this.teams!.drop().catch(filterUseless);
    await this.subjects!.drop().catch(filterUseless);
  }
}
