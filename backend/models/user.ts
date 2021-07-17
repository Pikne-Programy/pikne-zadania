// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UserRole, UserType } from "../types/db.ts";
import { IDatabase } from "../interfaces/mod.ts";

export class User {
  private _id: string;
  private _email: string;
  private _name: string;
  private _dhpassword: string;
  private _team: number;
  private _tokens: string[];
  private _seed: number;
  private _role: UserRole;

  constructor(
    private user: UserType,
    private db: IDatabase,
  ) {
    this._id = user.id;
    this._email = user.email;
    this._name = user.name;
    this._dhpassword = user.dhpassword;
    this._team = user.team;
    this._tokens = user.tokens;
    this._seed = user.seed;
    this._role = user.role;
  }

  get id() {
    return this._id;
  }
  get email() {
    return this._email;
  }
  get name() {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
    this.db.promiseQueue.push(
      this.db.users!.updateOne({ id: this.id }, { $set: { name: this.name } }),
    );
  }
  get dhpassword() {
    return this._dhpassword;
  }
  get team() {
    return this._team;
  }
  set team(value: number) {
    this._team = value;
    this.db.promiseQueue.push(
      this.db.users!.updateOne({ id: this.id }, { $set: { team: this.team } }),
    );
  }
  readonly tokens = {
    exists: (jwt: string) => {
      return this._tokens.includes(jwt) ? true : false;
    },
    add: (jwt: string) => {
      this._tokens.push(jwt);
      this.db.promiseQueue.push(
        this.db.users!.updateOne(
          { id: this.id },
          { $addToSet: { tokens: jwt } },
        ),
      );
      return true;
    },
    remove: (jwt: string) => {
      if (!this.tokens.exists(jwt)) return false;
      this.db.promiseQueue.push(
        this.db.users!.updateOne({ id: this.id }, { $pull: { tokens: jwt } }),
      );
      return true;
    },
  };

  get seed() {
    return this._seed;
  }
  set seed(value: number) {
    this._seed = value;
    this.db.promiseQueue.push(
      this.db.users!.updateOne({ id: this.id }, { $set: { seed: this.seed } }),
    );
  }
  get role() {
    return this._role;
  }
  set role(value: UserRole) {
    this._role = value;
    this.db.promiseQueue.push(
      this.db.users!.updateOne({ id: this.id }, { $set: { role: this.role } }),
    );
  }
}
