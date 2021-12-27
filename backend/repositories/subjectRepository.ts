// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError } from "../common/mod.ts";
import { Subject } from "../models/mod.ts"; // TODO: get rid off
import { Collection } from "../deps.ts";

export class SubjectRepository {
  constructor(public collection: Collection<Subject>) {}

  async get(id: string) {
    const subject = await this.collection.findOne({ id });
    return subject ? new Subject(subject) : subject;
  }

  async init(_diskSubjects: string[]) {
    const diskSubjects = new Set(_diskSubjects);
    const dbSubjects = new Set(
      (await this.collection.find().toArray()).map(({ id }) => id)
    );

    // TODO: see FindCursor (without .toArray())
    const allSubjects = new Set([...diskSubjects, ...dbSubjects]);

    for (const id of allSubjects) {
      const inDisk = diskSubjects.has(id);
      const inDb = dbSubjects.has(id);

      if (inDisk && !inDb) {
        await this.collection.insertOne({ id, assignees: null });
      } else if (!inDisk && inDb) {
        await this.collection.deleteOne({ id });
      }
    }
  }

  async list() {
    const subjects = await this.collection
      .find(undefined, {
        projection: {
          id: 1,
        },
      })
      .toArray();
    subjects.map(({ id }) => id);
  }

  async add(id: string, assignees: string[] | null) {
    const subject = await this.get(id);

    if (!subject) {
      throw new CustomDictError("SubjectAlreadyExists", { subject: id });
    }

    this.collection.insertOne({ id, assignees });
  }
  setAssignees(id: string, value: string[] | null) {
    return this.collection.updateOne(
      { id },
      {
        $set: { assignees: value },
      }
    );
  }
}
