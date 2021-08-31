// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError, SubjectType } from "../types/mod.ts";
import {
  IDatabaseService,
  IExerciseStore,
  ISubjectStore,
} from "../interfaces/mod.ts";
import { Subject } from "../models/mod.ts"; // TODO: get rid off

export class SubjectStore implements ISubjectStore {
  constructor(
    private db: IDatabaseService,
    private exs: IExerciseStore,
  ) {}
  get(id: string) {
    return new Subject(this.db, id);
  }

  async init() {
    const diskSubjects = new Set(this.exs.listSubjects());
    const dbSubjects = new Set(
      (await this.db.subjects!.find().toArray()).map((x: SubjectType) => x.id),
    ); // TODO: see FindCursor (without .toArray())
    const allSubjects = new Set([...dbSubjects, ...dbSubjects]);
    for (const id of allSubjects) {
      const [inDisk, inDb] = [id in diskSubjects, id in dbSubjects];
      if (inDisk && !inDb) {
        await this.db.subjects!.insertOne({ id, assignees: null });
      } else if (!inDisk && inDb) {
        await this.db.subjects!.deleteOne({ id });
      }
    }
  }

  async list() {
    const subjects = await this.db.subjects!.find().toArray();
    return subjects.map((x) => x.id);
  }

  async add(id: string, assignees: string[] | null) {
    const subject = this.get(id);
    if (await subject.exists()) {
      return await new CustomDictError("SubjectAlreadyExists", { subject: id });
    }
    this.db.subjects!.insertOne({ id, assignees });
  }
}
