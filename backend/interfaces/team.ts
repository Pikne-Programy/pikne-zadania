// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ITeam {
  exists(): Promise<boolean>;
  name: {
    get: () => Promise<string>;
    set: (value: string) => Promise<void>;
  };
  assignee: {
    get: () => Promise<string>;
    set: (value: string) => Promise<void>;
  };
  members: {
    get: () => Promise<string[]>;
    add: (uid: string) => Promise<void>;
    remove: (uid: string) => Promise<void>;
  };
  invitation: {
    get: () => Promise<string | undefined>;
    set: (value: string | undefined) => Promise<void>;
  };
}
