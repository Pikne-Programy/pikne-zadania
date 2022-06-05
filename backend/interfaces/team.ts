// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SessionType } from "../types/db.ts";

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
    /** It returns true if everything went well. */
    set: (value: string | undefined) => Promise<boolean>;
  };
  session: {
    get: () => Promise<SessionType>;
    drop: () => Promise<void>;
    end: () => Promise<void>;
    isFinished: () => Promise<boolean>;
    exercises: {
      get: () => Promise<string[]>;
      add: (eid: string) => Promise<void>;
      remove: (eid: string) => Promise<void>;
    };
    report: {
      get: () => Promise<{ [uid: string]: { [eid: string]: null | number } }>;
      add: (eid: string) => Promise<void>;
      remove: (eid: string) => Promise<void>;
      set: (uid: string, eid: string, value: null | number) => Promise<void>;
    };
  };
}
