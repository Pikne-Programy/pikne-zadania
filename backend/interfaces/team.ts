// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReportType, SessionType } from "../types/mod.ts";

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
    seedOffset: {
      get: () => Promise<number>;
      set: (value: number) => Promise<void>;
    };
    exercises: {
      get: () => Promise<string[]>;
      add: (eid: string) => Promise<void>;
      remove: (eid: string) => Promise<void>;
    };
    users: {
      get: () => Promise<string[]>;
      add: (uid: string) => Promise<void>;
      remove: (uid: string) => Promise<void>;
    };
    report: {
      get: () => Promise<ReportType>;
      set: (uid: string, eid: string, value: null | number) => Promise<void>;
    };
  };
  reports: {
    list: () => Promise<string[]>;
    push: (path: string) => Promise<void>;
    pull: (path: string) => Promise<void>;
  };
}
