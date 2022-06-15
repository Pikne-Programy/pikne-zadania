// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SessionType, TeamType } from "../types/mod.ts";
import { IDatabaseService, ITeam } from "../interfaces/mod.ts";

// TODO: make an abstract Model class
export class Team implements ITeam {
  constructor(
    private db: IDatabaseService,
    public readonly id: number,
  ) {}

  private async get<T extends keyof TeamType>(key: T): Promise<TeamType[T]> {
    const team = await this.db.teams!.findOne({ id: this.id });
    if (!team) throw new Error(); // TODO: error message
    return team[key];
  }
  private async set<T extends keyof TeamType>(key: T, value: TeamType[T]) {
    if (!await this.exists()) throw new Error(); // TODO: error message
    if (value === undefined) {
      await this.db.teams!.updateOne({ id: this.id }, {
        $unset: { [key]: "" },
      });
    } else {
      await this.db.teams!.updateOne({ id: this.id }, {
        $set: { [key]: value },
      });
    }
  }

  async exists() {
    return (await this.db.teams!.findOne({ id: this.id })) !== undefined;
  }

  readonly name = {
    get: async () => await this.get("name"),
    set: async (value: string) => await this.set("name", value),
  };

  readonly assignee = {
    get: async () => await this.get("assignee"),
    set: async (value: string) => await this.set("assignee", value),
  };

  readonly members = {
    add: async (uid: string) => {
      await this.db.teams!.updateOne({ id: this.id }, {
        $push: { members: { $each: [uid] } }, // alternative: `$push: { members: uid } } as any`
      });
    },
    get: async () => await this.get("members"),
    remove: async (uid: string) => {
      await this.db.teams!.updateOne({ id: this.id }, {
        $pull: { members: uid },
      });
    },
  };

  readonly invitation = {
    get: async () => await this.get("invitation"),
    set: async (invitation?: string) => {
      if (invitation === undefined) await this.set("invitation", undefined);
      else {
        const existing = (await this.db.teams!.findOne({ invitation }))?.id;
        // * assuming there were no two teams with same id; `findOne` not `find`
        if (existing !== undefined && existing !== this.id) return false;
        await this.set("invitation", invitation);
      }
      return true;
    },
  };

  readonly session = {
    get: async () => await this.get("session"),
    drop: async () => {
      const emptySession: SessionType = {
        isFinished: false,
        seedOffset: 0,
        exercises: [],
        report: {},
      };
      await this.set("session", emptySession);
    },
    end: async () => {
      if (!await this.exists()) throw new Error(); // TODO: error message
      await this.db.teams!.updateOne({ id: this.id }, {
        $set: { "session.isFinished": true },
      });
    },
    isFinished: async () => {
      const session = await this.session.get();
      return session["isFinished"];
    },
    seedOffset: {
      get: async () => {
        const session = await this.session.get();
        return session["seedOffset"];
      },
      set: async (value: number) => {
        if (!await this.exists()) throw new Error(); // TODO: error message
        await this.db.teams!.updateOne({ id: this.id }, {
          $set: { "session.seedOffset": value },
        });
      },
    },
    exercises: {
      get: async () => {
        const session = await this.session.get();
        return session["exercises"];
      },
      add: async (eid: string) => {
        if (!await this.exists()) throw new Error(); // TODO: error message
        await this.db.teams!.updateOne({ id: this.id }, {
          // deno-lint-ignore no-explicit-any
          $push: { "session.exercises": eid } as any, // types doesn't match in linter, but works in mongo
        });
        const uids = await this.session.users.get();
        for (const uid of uids) {
          const key = `session.exercises.${uid}.${eid}`;
          await this.db.teams!.updateOne({ id: this.id }, {
            $set: { [key]: null },
          });
        }
      },
      remove: async (eid: string) => {
        if (!await this.exists()) throw new Error(); // TODO: error message
        await this.db.teams!.updateOne({ id: this.id }, {
          // deno-lint-ignore no-explicit-any
          $pull: { "session.exercises": eid } as any, // types doesn't match in linter, but works in mongo
        });
        const uids = await this.session.users.get();
        for (const uid of uids) {
          const key = `session.exercises.${uid}.${eid}`;
          await this.db.teams!.updateOne({ id: this.id }, {
            $unset: { [key]: "" },
          });
        }
      },
    },
    users: {
      get: async () => {
        const report = await this.session.report.get();
        return Object.keys(report);
      },
      add: async (uid: string) => {
        const exercises = await this.session.exercises.get();
        const key = `session.report.${uid}`;
        await this.db.teams!.updateOne({ id: this.id }, {
          $set: { [key]: {} },
        });
        for (const eid of exercises) {
          await this.session.report.set(uid, eid, null);
        }
      },
      remove: async (uid: string) => {
        if (!await this.exists()) throw new Error(); // TODO: error message
        const key = `session.report.${uid}`;
        await this.db.teams!.updateOne({ id: this.id }, {
          $unset: { [key]: "" },
        });
      },
    },
    report: {
      get: async () => {
        const session = await this.session.get();
        return session["report"];
      },
      set: async (uid: string, eid: string, value: null | number) => {
        const exercises = await this.session.exercises.get();
        if (!exercises.includes(eid)) throw new Error(); // TODO: error message
        const key = `session.report.${uid}.${eid}`;
        await this.db.teams!.updateOne({ id: this.id }, {
          $set: { [key]: value },
        });
      },
    },
  };
  readonly reports = {
    list: async () => await this.get("reports"),
    push: async (path: string) => {
      if (!await this.exists()) throw new Error(); // TODO: error message
      await this.db.teams!.updateOne({ id: this.id }, {
        $push: { "reports": { $each: [path] } },
      });
    },
    pull: async (path: string) => {
      if (!await this.exists()) throw new Error(); // TODO: error message
      await this.db.teams!.updateOne({ id: this.id }, {
        $pull: { "reports": path },
      });
    },
  };
}
