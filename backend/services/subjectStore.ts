// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ISubjectStore } from "../interfaces/mod.ts";

export class SubjectStore implements ISubjectStore {
  async list() {
    return await [];
  }
  async add(_id: string, _assignees: string[]) {}
  assignees = (_id: string) => ({
    get: async () => await [],
    set: async (_: string[]) => {},
  });
}
