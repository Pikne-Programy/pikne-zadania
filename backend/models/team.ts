// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TeamType } from "../types/mod.ts";
import { Collection } from "../deps.ts";

// TODO: make an abstract Model class
export class Team {
  constructor(
    private teamsCollection: Collection<TeamType>,
    public readonly id: number
  ) {}

  private async get<T extends keyof TeamType>(key: T): Promise<TeamType[T]> {
    const team = await this.teamsCollection.findOne({ id: this.id });
    if (!team) {
      // TODO: error message
      throw new Error();
    }
    return team[key];
  }

  private async set<T extends keyof TeamType>(key: T, value: TeamType[T]) {
    if (!(await this.exists())) {
      // TODO: error message
      throw new Error();
    }

    await this.teamsCollection.updateOne(
      { id: this.id },
      value === undefined
        ? {
            $unset: { [key]: "" },
          }
        : {
            $set: { [key]: value },
          }
    );
  }

  exists() {
    return this.teamsCollection.findOne({ id: this.id }).then(Boolean);
  }

  readonly name = {
    get: () => this.get("name"),
    set: (value: string) => this.set("name", value),
  };

  readonly assignee = {
    get: () => this.get("assignee"),
    set: (value: string) => this.set("assignee", value),
  };

  readonly members = {
    add: async (uid: string) => {
      await this.teamsCollection.updateOne(
        { id: this.id },
        {
          $push: { members: uid },
        }
      );
    },
    get: () => this.get("members"),
    remove: async (uid: string) => {
      await this.teamsCollection.updateOne(
        { id: this.id },
        {
          $pull: { members: uid },
        }
      );
    },
  };

  readonly invitation = {
    get: () => this.get("invitation"),
    set: async (invitation?: string) => {
      if (invitation === undefined) {
        await this.set("invitation", undefined);
      } else {
        const existing = await this.teamsCollection
          .findOne({ invitation })
          .then((team) => team?.id);

        // * assuming there were no two teams with same id; `findOne` not `find`
        if (existing !== undefined && existing !== this.id) {
          return false;
        }

        await this.set("invitation", invitation);
      }
      return true;
    },
  };
}
