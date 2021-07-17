// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { User } from "../models/mod.ts";
import { IUserFactory, IUsers } from "../interfaces/mod.ts";

export class Users implements IUsers {
  constructor(
    private uf: IUserFactory,
  ) {}

  delete(id: string) {
    return this.uf.delete(id);
  }

  parse(user: User) {
    return {
      name: user.name,
      team: user.team,
      number: user.role.name === "student" ? user.role.number : null,
    };
  }

  async info(id: string) {
    const user = await this.uf.get(id);
    if (!user) return null;
    return this.parse(user);
  }

  async update(id: string, number?: number, name?: string) {
    const user = await this.uf.get(id);
    if (!user) return 1;
    if (number !== undefined && !isNaN(number)) { // TODO(Nircek): rework schemas
      if (user.role.name !== "student") return 2;
      user.role.number = number;
    }
    if (name !== undefined) user.name = name;
    return 0;
  }
}
