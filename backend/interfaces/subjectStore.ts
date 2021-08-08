// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ISubjectStore {
  list(): Promise<string[]>;
  add(id: string, assignees: string[]): Promise<void>;
  assignees(id: string): {
    get(): Promise<string[]>;
    set(assignees: string[]): Promise<void>;
    // add(uid: string): void;
    // remove(uid: string): void;
  };
}
