// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError } from "../types/mod.ts";
import {
  IConfigService,
  IDatabaseService,
  ITeamStore,
} from "../interfaces/mod.ts";
import { StoreTarget } from "./mod.ts";
import { Team } from "../models/mod.ts"; // TODO: get rid off

export class TeamStore implements ITeamStore {
  constructor(
    private cfg: IConfigService,
    private db: IDatabaseService,
    private target: StoreTarget,
  ) {}

  private handle<T>(x: T | CustomDictError): T {
    if (x instanceof CustomDictError) throw x;
    return x;
  }

  async init() {
    // create static teachers' team if not already created
    if (!(await this.get(1).exists())) {
      // teachers' team
      const assignee = this.cfg.hash("root");
      this.handle( // better safe than sorry
        await this.add(1, { name: "Teachers", assignee }, true),
      );
    }
  }

  async nextTeamId() {
    return Math.max(...(await this.list()).map((x) => x.id)) + 1;
  }

  async list() {
    return await this.db.teams!.find().toArray();
  }

  get(id: number) {
    return new Team(this.db, id);
  }

  async add(
    teamId: number | null,
    options: { name: string; assignee: string },
    force = false,
  ) {
    if (!force && !await this.target.us.get(options.assignee).exists()) {
      return new CustomDictError("UserNotFound", { userId: options.assignee });
    }
    teamId ??= await this.nextTeamId();
    if (!force && await this.get(teamId).exists()) {
      return new CustomDictError("TeamAlreadyExists", { teamId });
    }
    await this.db.teams!.insertOne({
      id: teamId,
      name: options.name,
      assignee: options.assignee,
      members: [],
    });
    return teamId;
  }
  async delete(teamId: number) {
    const team = this.get(teamId);
    if (!await team.exists()) {
      return new CustomDictError("TeamNotFound", { teamId });
    }
    for (const uid of await team.members.get()) {
      await this.target.us.delete(uid);
    }
    await this.db.teams!.deleteOne({ id: team.id });
  }

  readonly invitation = {
    get: async (invitation: string) => {
      const team = await this.db.teams!.findOne({ invitation });
      if (!team) return null;
      return team.id;
    },
    create: (id: number) => {
      const ntob = (n: number): string => {
        const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
          "abcdefghijklmnopqrstuvwxyz0123456789+/";
        return base64[n];
      };
      const randomArray = new Uint8Array(4);
      window.crypto.getRandomValues(randomArray);
      let invitation = ntob(id);
      for (const n of randomArray) {
        invitation += ntob(n % 64);
      }
      return invitation;
    },
  };
}
