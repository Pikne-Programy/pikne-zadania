// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SubjectType } from "../types/mod.ts";
import { Collection } from "../deps.ts";

// TODO: make an abstract Model class [store's get with NotFound?]
export class Subject {
  constructor(
    private subjectsCollection: Collection<SubjectType>,
    public readonly id: string
  ) {}

  private async get<T extends keyof SubjectType>(
    key: T
  ): Promise<SubjectType[T]> {
    const subject = await this.subjectsCollection.findOne({ id: this.id });

    if (!subject) {
      // TODO: error message
      throw new Error();
    }

    return subject[key];
  }

  private async set<T extends keyof SubjectType>(
    key: T,
    value: SubjectType[T]
  ) {
    if (!(await this.exists())) {
      // TODO: error message
      throw new Error();
    }

    await this.subjectsCollection.updateOne(
      { id: this.id },
      { $set: { [key]: value } }
    );
  }

  exists() {
    return this.subjectsCollection.findOne({ id: this.id }).then(Boolean);
  }

  readonly assignees = {
    get: () => this.get("assignees"),
    set: async (value: string[] | null) => {
      await this.subjectsCollection.updateOne(
        { id: this.id },
        {
          $set: { assignees: value },
        }
      );
    },
  };
}
