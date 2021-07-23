// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Subject } from "../models/mod.ts";

export interface ISubjectStore {
  list(): Promise<Subject[]>;
  add(id: string, assignees: string[]): Promise<void>;
  assignees: {
    get(id: string): Promise<string[]>;
    set(id: string, assignees: string[]): Promise<void>;
    // add(id: string, uid: string): void;
    // remove(id: string, uid: string): void;
  };
  getStaticContentPath(subject: string): string; // TODO: get rid off
}
