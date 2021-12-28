// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Team } from "../models/mod.ts";
import { Collection } from "../deps.ts";
import { HashService } from "../services/mod.ts";
import { Repository } from "./mod.ts";

export class TeamRepository extends Repository<Team> {
  constructor(private hashService: HashService, collection: Collection<Team>) {
    super(Team, collection);
  }

  async init() {
    // create static teachers' team if not already created
    if (await this.get(1)) {
      return;
    }
    
    await this.collection.insertOne({
      id: 1,
      name: "Teachers",
      // teachers' team
      assignee: this.hashService.hash("root"),
      members: [],
      invitation: null,
    });
  }
}
