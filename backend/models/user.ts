// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RoleType, UserType } from "../types/mod.ts";
import { IDatabaseService, IUser } from "../interfaces/mod.ts";
import { StoreTarget } from "../services/mod.ts";

export class User implements IUser {
  constructor(
    private db: IDatabaseService,
    private target: StoreTarget,
    public readonly id: string,
  ) {}

  private async get<T extends keyof UserType>(key: T): Promise<UserType[T]> {
    if (!await this.exists()) {
      throw new Error(`User with id ${this.id} doesn't exist`); // TODO: error message
    }
    const user = await this.db.users!.findOne({ id: this.id });
    if (!user) throw new Error(`User with id ${this.id} doesn't exist`); // TODO: error message
    return user[key];
  }
  private async set<T extends keyof UserType>(key: T, value: UserType[T]) {
    if (!await this.exists()) throw new Error(); // TODO: error message
    await this.db.users!.updateOne({ id: this.id }, { $set: { [key]: value } });
  }

  async exists() {
    return (await this.db.users!.findOne({ id: this.id })) ? true : false;
  }

  readonly login = {
    get: async () => await this.get("login"),
    set: async (value: string) => await this.set("login", value),
  };

  readonly name = {
    get: async () => await this.get("name"),
    set: async (value: string) => await this.set("name", value),
  };

  readonly dhPassword = {
    get: async () => await this.get("dhPassword"),
    set: async (value: string) => await this.set("dhPassword", value),
  };

  readonly team = {
    get: async () => await this.get("team"),
    set: async (value: number) => {
      const oldTeam = this.target.ts.get(await this.team.get());
      const newTeam = this.target.ts.get(value);
      if (oldTeam === newTeam) return;
      await oldTeam.members.remove(this.id);
      await newTeam.members.add(this.id);
      await this.set("team", value);
    },
  };

  readonly tokens = {
    add: async (value: string) => {
      await this.db.users!.updateOne(
        { id: this.id },
        { $addToSet: { tokens: value } },
      );
    },
    exists: async (value: string) => {
      const tokens = await this.get("tokens");
      return tokens.includes(value);
    },
    remove: async (value: string) => {
      await this.db.users!.updateOne({ id: this.id }, {
        $pull: { tokens: value },
      });
    },
  };

  readonly seed = {
    get: async () => await this.get("seed"),
    set: async (value: number) => await this.set("seed", value),
  };

  readonly number = {
    get: async () => await this.get("number"),
    set: async (value?: number) => await this.set("number", value),
  };

  readonly role = {
    get: async () => await this.get("role"),
    set: async (value: RoleType) => await this.set("role", value),
  };

  readonly exercises = {
    add: async (id: string, value: number) => {
      if (await this.exercises.get(id) !== undefined) {
        throw new Error(`Exercise with id ${id} already exists`);
      }
      await this.db.users!.updateOne(
        { id: this.id },
        { $set: { [`exercises.${id}`]: value } },
      );
    },
    get: async (id: string) => (await this.get("exercises"))[id],
    set: async (id: string, value: number) => {
      await this.db.users!.updateOne({ id: this.id }, {
        $set: { [`exercises.${id}`]: value },
      });
    },
    update: async (id: string, value: number) => {
      const oldValue = await this.exercises.get(id);
      if (oldValue === undefined) {
        await this.exercises.add(id, value);
      } else if (oldValue < value) {
        await this.db.users!.updateOne({ id: this.id }, {
          $set: { [`exercises.${id}`]: value },
        });
      }
    },
    remove: async (id: string) => {
      await this.db.users!.updateOne(
        { id: this.id },
        { $unset: { [`exercises.${id}`]: "" } },
      );
    },
  };
}
