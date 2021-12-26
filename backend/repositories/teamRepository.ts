// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TeamType, Team } from "../models/mod.ts";
import { CustomDictError } from "../common/mod.ts";
import { Collection } from "../deps.ts";
import { HashService } from "../services/mod.ts";

export class TeamRepository {
  constructor(
    private hashService: HashService,
    public collection: Collection<TeamType>
  ) {}

  async init() {
    // create static teachers' team if not already created
    if (await this.get(1).exists()) {
      return;
    }
    // teachers' team
    const assignee = this.hashService.hash("root");

    await this.add(1, { name: "Teachers", assignee }, true);
  }

  async nextTeamId() {
    return Math.max(...(await this.list()).map(({ id }) => id)) + 1;
  }

  list() {
    return this.collection.find().toArray();
  }

  get(id: number) {
    return new Team(this, id);
  }

  async add(
    teamId: number | null,
    options: { name: string; assignee: string },
    force = false
  ) {
    teamId ??= await this.nextTeamId();

    if (!force && (await this.get(teamId).exists())) {
      throw new CustomDictError("TeamAlreadyExists", { teamId });
    }

    await this.collection.insertOne({
      id: teamId,
      name: options.name,
      assignee: options.assignee,
      members: [],
      invitation: null,
    });

    return teamId;
  }
  async delete(teamId: number) {
    const team = this.get(teamId);

    if (!(await team.exists())) {
      throw new CustomDictError("TeamNotFound", { teamId });
    }

    await this.collection.deleteOne({ id: team.id });
  }

  readonly invitation = {
    get: async (invitation: string) => {
      const team = await this.collection.findOne({ invitation });

      if (!team) {
        return null;
      }

      return team.id;
    },
    create: (id: number) => {
      const ntob = (n: number): string => {
        const base64 =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
          "abcdefghijklmnopqrstuvwxyz0123456789+/";
        return base64[n];
      };

      const randomArray = new Uint8Array(4);

      globalThis.crypto.getRandomValues(randomArray);

      let invitation = ntob(id);

      for (const n of randomArray) {
        invitation += ntob(n % 64);
      }

      return invitation;
    },
  };
}
