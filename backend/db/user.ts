// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UserFactory } from "../services/user.ts";
import { UserRole, UserType } from "../types/db.ts";

export class User {
  private _id: string;
  private _email: string;
  private _name: string;
  private _dhpassword: string;
  private _team: number;
  private _tokens: string[];
  private _seed: number;
  private _role: UserRole;

  constructor(private user: UserType, private userFactory: UserFactory) {
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
    this.userFactory.promiseQueue.push(() =>
      this.userFactory.set({ id: this.id, name: this.name })
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
    this.userFactory.promiseQueue.push(() =>
      this.userFactory.set({ id: this.id, name: this.name })
    );
  }
  get tokens() {
    return this._tokens;
  }
  set tokens(value: string[]) {
    this._tokens = value;
    this.userFactory.promiseQueue.push(() =>
      this.userFactory.set({ id: this.id, tokens: this.tokens })
    );
  }
  get seed() {
    return this._seed;
  }
  set seed(value: number) {
    this._seed = value;
    this.userFactory.promiseQueue.push(() =>
      this.userFactory.set({ id: this.id, seed: this.seed })
    );
  }
  get role() {
    return this._role;
  }
  set role(value: UserRole) {
    this._role = value;
    this.userFactory.promiseQueue.push(() =>
      this.userFactory.set({ id: this.id, role: this.role })
    );
  }
}
