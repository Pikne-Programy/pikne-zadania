// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError } from "../types/mod.ts";
import { ExerciseRepository } from "./mod.ts";
import { Subject } from "../models/mod.ts"; // TODO: get rid off
import { SubjectType } from "../types/mod.ts";
import { Collection } from "../deps.ts";

export class SubjectRepository {
  constructor(
    private subjectsCollection: Collection<SubjectType>,
    private exerciseRepository: ExerciseRepository
  ) {}

  get(id: string) {
    return new Subject(this.subjectsCollection, id);
  }

  async init() {
    const diskSubjects = new Set(this.exerciseRepository.listSubjects());
    const dbSubjects = new Set(
      (await this.subjectsCollection.find().toArray()).map(({ id }) => id)
    );

    // TODO: see FindCursor (without .toArray())
    const allSubjects = new Set([...diskSubjects, ...dbSubjects]);

    for (const id of allSubjects) {
      const inDisk = diskSubjects.has(id);
      const inDb = dbSubjects.has(id);

      if (inDisk && !inDb) {
        await this.subjectsCollection.insertOne({ id, assignees: null });
      } else if (!inDisk && inDb) {
        await this.subjectsCollection.deleteOne({ id });
      }
    }
  }

  async list() {
    const subjects = await this.subjectsCollection.find().toArray();
    return subjects.map(({ id }) => id);
  }

  async add(id: string, assignees: string[] | null) {
    const subject = this.get(id);

    if (await subject.exists()) {
      return new CustomDictError("SubjectAlreadyExists", { subject: id });
    }

    this.subjectsCollection.insertOne({ id, assignees });
  }
}
