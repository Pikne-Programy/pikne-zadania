// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Team } from "../models/mod.ts";
import { CustomDictError } from "../common/mod.ts";
import { Collection } from "../deps.ts";
import { HashService } from "../services/mod.ts";

export class TeamRepository {
  constructor(
    private hashService: HashService,
    public collection: Collection<Team>
  ) {}

  async set<T extends keyof Team>(team: Team, key: T, value: Team[T]) {
    await this.collection.updateOne(
      { id: team.id },
      value === undefined
        ? {
            $unset: { [key]: "" },
          }
        : {
            $set: { [key]: value },
          }
    );
  }

  async init() {
    // create static teachers' team if not already created
    if (await this.get(1)) {
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

  async get(id: number) {
    const team = await this.collection.findOne({ id });
    return team ? new Team(team) : team;
  }

  async add(
    teamId: number | null,
    options: { name: string; assignee: string },
    force = false
  ) {
    teamId ??= await this.nextTeamId();

    if (!force && (await this.get(teamId))) {
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
    const team = await this.get(teamId);

    if (!team) {
      throw new CustomDictError("TeamNotFound", { teamId });
    }

    await this.collection.deleteOne({ id: team.id });
  }
  getByInvitation(invitation: string) {
    return this.collection.findOne({ invitation });
  }

  invitationFor(team: Team) {
    return {
      create: (id: number) => {
        const ntob = (n: number): string => {
          const base64 =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "abcdefghijklmnopqrstuvwxyz0123456789+/";
          return base64[n];
        };

        return globalThis.crypto
          .getRandomValues(new Uint8Array(4))
          .reduce((invitation, n) => invitation + ntob(n % 64), ntob(id));
      },
      set: async (invitation?: string) => {
        if (invitation === undefined) {
          await this.set(team, "invitation", undefined);
        } else {
          const existing = await this.collection
            .findOne({ invitation })
            .then((team) => team?.id);

          // * assuming there were no two teams with same id; `findOne` not `find`
          if (existing !== undefined && existing !== team.id) {
            return false;
          }

          await this.set(team, "invitation", invitation);
        }
        return true;
      },
    };
  }

  membersFor(team: Team) {
    return {
      add: async (uid: string) => {
        await this.collection.updateOne(
          { id: team.id },
          {
            $push: { members: uid },
          }
        );
      },
      remove: async (uid: string) => {
        await this.collection.updateOne(
          { id: team.id },
          {
            $pull: { members: uid },
          }
        );
      },
    };
  }
}
