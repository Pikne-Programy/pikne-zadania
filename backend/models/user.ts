// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UserRepository } from "../repositories/mod.ts";

export type RoleType = "student" | "teacher" | "admin";

export type UserType = {
  id: string;
  login: string;
  name: string;
  dhPassword: string; // double hashed password
  team: number;
  tokens: string[];
  seed?: number;
  role: RoleType;
  number?: number;
  exercises: { [key: string]: number };
};

export class User {
  constructor(
    private usersRepository: UserRepository,
    public readonly id: string
  ) {}

  private async get<T extends keyof UserType>(key: T): Promise<UserType[T]> {
    const user = await this.usersRepository.collection.findOne({ id: this.id });
    if (!user) {
      throw new Error(`User with id ${this.id} does not exist`);
    }

    return user[key];
  }

  private async set<T extends keyof UserType>(key: T, value: UserType[T]) {
    const { matchedCount } = await this.usersRepository.collection.updateOne(
      { id: this.id },
      value === undefined
        ? {
            $unset: { [key]: "" },
          }
        : {
            $set: { [key]: value },
          }
    );

    if (!matchedCount) {
      throw new Error(); // TODO: error message
    }
  }

  exists() {
    return this.usersRepository.collection
      .findOne({ id: this.id })
      .then(Boolean);
  }

  readonly login = {
    get: () => this.get("login"),
    set: (value: string) => this.set("login", value),
  };

  readonly name = {
    get: () => this.get("name"),
    set: (value: string) => this.set("name", value),
  };

  readonly dhPassword = {
    get: () => this.get("dhPassword"),
    set: (value: string) => this.set("dhPassword", value),
  };

  readonly team = {
    get: () => this.get("team"),
  };

  readonly tokens = {
    add: async (value: string) => {
      await this.usersRepository.collection.updateOne(
        { id: this.id },
        { $addToSet: { tokens: value } }
      );
    },
    exists: async (value: string) => {
      const tokens = await this.get("tokens");
      return tokens.includes(value);
    },
    remove: async (value: string) => {
      await this.usersRepository.collection.updateOne(
        { id: this.id },
        {
          $pull: { tokens: value },
        }
      );
    },
  };

  readonly seed = {
    get: () => this.get("seed"),
    set: (value: number) => this.set("seed", value),
  };

  readonly number = {
    get: () => this.get("number"),
    set: (value?: number) => this.set("number", value),
  };

  readonly role = {
    get: () => this.get("role"),
    set: (value: RoleType) => this.set("role", value),
  };

  readonly exercises = {
    add: async (id: string, value: number) => {
      if ((await this.exercises.get(id)) !== undefined) {
        throw new Error(`Exercise with id ${id} already exists`);
      }
      await this.usersRepository.collection.updateOne(
        { id: this.id },
        { $set: { [`exercises.${id}`]: value } }
      );
    },
    get: async (id: string) => (await this.get("exercises"))[id],
    set: async (id: string, value: number) => {
      await this.usersRepository.collection.updateOne(
        { id: this.id },
        {
          $set: { [`exercises.${id}`]: value },
        }
      );
    },
    update: async (id: string, value: number) => {
      const oldValue = await this.exercises.get(id);
      if (oldValue === undefined) {
        await this.exercises.add(id, value);
      } else if (oldValue < value) {
        await this.usersRepository.collection.updateOne(
          { id: this.id },
          {
            $set: { [`exercises.${id}`]: value },
          }
        );
      }
    },
    remove: async (id: string) => {
      await this.usersRepository.collection.updateOne(
        { id: this.id },
        { $unset: { [`exercises.${id}`]: "" } }
      );
    },
  };
  async isTeacher() {
    return ["teacher", "admin"].includes(await this.role.get());
  }
}
