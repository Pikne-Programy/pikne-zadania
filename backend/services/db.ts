// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection, MongoClient } from "../deps.ts";
import { delay } from "../utils/mod.ts";
import { TeamType, UserType } from "../types/mod.ts";
import { IConfigService, IDatabaseService } from "../interfaces/mod.ts";

export class Database implements IDatabaseService {
  private client?: MongoClient;
  users?: Collection<UserType>;
  teams?: Collection<TeamType>;

  constructor(
    private cfg: IConfigService,
  ) {}

  async connect() {
    this.client = new MongoClient();
    await delay(this.cfg.MONGO_CONF.time); // wait for database
    await this.client.connect(this.cfg.MONGO_CONF.url); // throwable
    const _db = this.client.database(this.cfg.MONGO_CONF.db);

    this.users = _db.collection("users");
    this.teams = _db.collection("teams");
  }

  close() {
    this.client?.close();
  }
}
