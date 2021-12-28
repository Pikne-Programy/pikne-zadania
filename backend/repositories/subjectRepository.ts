// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Subject } from "../models/mod.ts";
import { Collection } from "../deps.ts";
import { Repository } from "./mod.ts";

export class SubjectRepository extends Repository<Subject> {
  constructor(collection: Collection<Subject>) {
    super(Subject, collection);
  }

  async init(_diskSubjects: string[]) {
    const diskSubjects = new Set(_diskSubjects);
    const dbSubjects = new Set(
      await this.collection.find().map(({ id }) => id)
    );

    // TODO: see FindCursor (without .toArray())
    const allSubjects = new Set([...diskSubjects, ...dbSubjects]);

    for (const id of allSubjects) {
      const inDisk = diskSubjects.has(id);
      const inDb = dbSubjects.has(id);

      if (inDisk && !inDb) {
        //FIXME that sync db and disk but why?
        await this.collection.insertOne({ id, assignees: null });
      } else if (!inDisk && inDb) {
        await this.collection.deleteOne({ id });
      }
    }
  }
}
