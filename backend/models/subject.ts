// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SubjectType } from "../types/mod.ts";
import { IDatabaseService, ISubject } from "../interfaces/mod.ts";

// TODO: make an abstract Model class
export class Subject implements ISubject {
  constructor(
    private db: IDatabaseService,
    public readonly id: string,
  ) {}

  private async get<T extends keyof SubjectType>(
    key: T,
  ): Promise<SubjectType[T]> {
    const subject = await this.db.subjects!.findOne({ id: this.id });
    if (!subject) throw new Error(); // TODO: error message
    return subject[key];
  }

  private async set<T extends keyof SubjectType>(
    key: T,
    value: SubjectType[T],
  ) {
    if (!await this.exists()) throw new Error(); // TODO: error message
    await this.db.teams!.updateOne({ id: this.id }, { $set: { [key]: value } });
  }

  async exists() {
    return (await this.db.subjects!.findOne({ id: this.id })) ? true : false;
  }

  readonly assignee = {
    get: async () => await this.get("assignees"),
    add: async (value: string) => {
      await this.db.subjects!.updateOne({ id: this.id }, {
        $push: { assignees: value },
      });
    },
    remove: async (value: string) => {
      await this.db.subjects!.updateOne({ id: this.id }, {
        $pull: { assignees: value },
      });
    },
  };
}
