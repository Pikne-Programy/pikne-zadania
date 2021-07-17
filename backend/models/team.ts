// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TeamType } from "../types/db.ts";
import { IDatabase } from "../interfaces/mod.ts";

export class Team {
  readonly _id: number;
  _name: string;
  _assignee: string;
  _members: string[];
  _invitation: string | null;

  constructor(private team: TeamType, private db: IDatabase) {
    this._id = team.id;
    this._name = team.name;
    this._assignee = team.assignee;
    this._members = team.members;
    this._invitation = team.invitation;
  }

  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
    this.db.promiseQueue.push(
      this.db.users!.updateOne({ id: this.id }, {
        $set: { name: this.name },
      }),
    );
  }
  get assignee() {
    return this._assignee;
  }
  set assignee(value: string) {
    this._assignee = value;
    this.db.promiseQueue.push(
      this.db.users!.updateOne({ id: this.id }, {
        $set: { assignee: this.assignee },
      }),
    );
  }
  readonly members = {
    get: () => {
      return this._members;
    },
    add: (uid: string) => {
      this._members.push(uid);
      this.db.promiseQueue.push(
        this.db.teams!.updateOne({ id: this.id }, { $push: { members: uid } }),
      );
    },
    remove: (uid: string) => {
      this._members.filter((x) => {
        return x != uid;
      });
      this.db.promiseQueue.push(
        this.db.teams!.updateOne({ id: this.id }, { $pull: { members: uid } }),
      );
    },
  };

  readonly invitation = {
    get: () => {
      return this._invitation;
    },
    set: (value: string | null) => {
      if (value !== null) {
        const tid = this.db.invitations[value];
        if (tid !== undefined) return;
        this.db.invitations[value] = this.id;
      }
      this._invitation = value;
      this.db.promiseQueue.push(
        this.db.teams!.updateOne(
          { id: this.id },
          { $set: { invitation: value } },
        ),
      );
    },
  };
  set(part: Partial<TeamType>, _lock?: symbol) {
    this.db.promiseQueue.push(
      this.db.teams!.updateOne({ id: this.id }, { $set: part }),
    );
    return true;
  }
}
