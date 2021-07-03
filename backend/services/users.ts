// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UserType } from "../types/mod.ts";
import { IUser, IUsers } from "../interfaces/mod.ts";

export class Users implements IUsers {
  constructor(
    private user: IUser,
  ) {}

  delete(id: string) {
    return this.user.delete(id);
  }

  parse(user: UserType) {
    return {
      name: user.name,
      team: user.team,
      number: user.role.name === "student" ? user.role.number : null,
    };
  }

  async info(id: string) {
    const user = await this.user.get(id);
    if (!user) return null;
    return this.parse(user);
  }

  async update(id: string, number?: number, name?: string) {
    const user = await this.user.get(id);
    if (!user) return 1;
    if (!name) name = user.name;
    if (number !== undefined && !isNaN(number)) {
      if (user.role.name !== "student") return 2;
      user.role.number = number;
    }
    const part = {
      id,
      name,
      role: user.role.name !== "student" ? undefined : {
        name: "student" as const,
        number: user.role.number,
        exercises: user.role.exercises,
      },
    };
    if (!await this.user.set(part)) {
      throw new Error(`The user ${id} existed but it doesn't exist.`);
    }
    return 0;
  }
}
