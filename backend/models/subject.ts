// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SubjectRepository } from "../repositories/mod.ts";

export type SubjectType = {
  id: string;
  assignees: string[] | null;
};
export class Subject {
  constructor(
    private subjectRepository: SubjectRepository,
    public readonly id: string
  ) {}

  private async get<T extends keyof SubjectType>(
    key: T
  ): Promise<SubjectType[T]> {
    const subject = await this.subjectRepository.collection.findOne({
      id: this.id,
    });

    if (!subject) {
      throw new Error(`Subject with id: "${this.id}" does not exists`);
    }

    return subject[key];
  }

  private async set<T extends keyof SubjectType>(
    key: T,
    value: SubjectType[T]
  ) {
    if (!(await this.exists())) {
      throw new Error(`Subject with id: "${this.id}" does not exists`);
    }

    await this.subjectRepository.collection.updateOne(
      { id: this.id },
      { $set: { [key]: value } }
    );
  }

  exists() {
    return this.subjectRepository.collection
      .findOne({ id: this.id })
      .then(Boolean);
  }

  readonly assignees = {
    get: () => this.get("assignees"),
    set: async (value: string[] | null) => {
      await this.subjectRepository.collection.updateOne(
        { id: this.id },
        {
          $set: { assignees: value },
        }
      );
    },
  };
}
