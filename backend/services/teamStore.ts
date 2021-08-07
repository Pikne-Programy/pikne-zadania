// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  IConfigService,
  IDatabaseService,
  ITeamStore,
} from "../interfaces/mod.ts";
import { Team } from "../models/mod.ts";
import { StoreTarget } from "./mod.ts";

export class TeamStore implements ITeamStore {
  private lastTid?: number;

  constructor(
    private cfg: IConfigService,
    private db: IDatabaseService,
    private target: StoreTarget,
  ) {}
  async init() {
    // create static teachers' team if not already created
    if (!(await this.get(1).exists())) {
      // teachers' team
      await this.add(1, { name: "Teachers", assignee: this.cfg.hash("root") });
    }
  }
  async nextTid(): Promise<number> {
    this.lastTid = Math.max(...(await this.list()).map((x) => x.id)) + 1;
    return this.lastTid;
  }
  async list() {
    return await this.db.teams!.find().toArray();
  }
  get(id: number) {
    return new Team(this.db, id);
  }
  async add(id: number | null, options: { name: string; assignee: string }) {
    if (await this.target.us.get(options.assignee).exists()) return 2;
    if (id !== null && await this.get(id).exists()) return 1;
    const team = {
      id: id ?? (await this.nextTid()),
      name: options.name,
      assignee: options.assignee,
      members: [],
      invitation: null,
    };
    await this.db.teams!.insertOne(team);
    return 0;
  }
  async delete(id: number) {
    const team = this.get(id);
    if (!await team.exists()) {
      throw new Error(`Team with id ${id} doesn't exist`);
    }
    for (const uid of await team.members.get()) {
      await team.members.remove(uid);
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
