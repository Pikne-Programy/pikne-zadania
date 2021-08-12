// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ISubject {
  exists(): Promise<boolean>;
  assignee: {
    get: () => Promise<string[]>;
    add: (value: string) => Promise<void>;
    remove: (value: string) => Promise<void>;
  };
}
