// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ATuple, createAbility } from "../common/mod.ts";
import { CanParameters } from "../deps.ts";
import { Ability, httpErrors } from "../deps.ts";

export enum UserRoles {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export class Guest {
  #ability!: Ability;
  can(...args: CanParameters<ATuple>) {
    this.#ability ||= createAbility(this);
    return this.#ability.can(...args);
  }
  cannot(...args: CanParameters<ATuple>) {
    this.#ability ||= createAbility(this);
    return this.#ability.cannot(...args);
  }
  assertCan(...args: CanParameters<ATuple>) {
    if (this.cannot(...args)) {
      const reason = this.#ability.relevantRuleFor(...args)?.reason;
      throw new httpErrors["Forbidden"](reason); //TODO custom error
    }
  }
}

export class User extends Guest {
  id!: string;
  login!: string;
  name!: string;
  dhPassword!: string; // double hashed password
  team!: number;
  seed?: number;
  role!: UserRoles;
  number?: number;
  tokens!: string[];
  exercises!: { [key: string]: number };
}
