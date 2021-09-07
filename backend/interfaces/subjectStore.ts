// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError } from "../types/mod.ts";
import { Subject } from "../models/mod.ts";

export interface ISubjectStore {
  init(): Promise<void>;
  get(id: string): Subject;
  list(): Promise<string[]>;
  add(
    subject: string,
    assignees: string[] | null,
  ): Promise<void | CustomDictError<"SubjectAlreadyExists">>;
}
