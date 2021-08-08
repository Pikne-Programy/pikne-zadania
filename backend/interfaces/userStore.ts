// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { User } from "../models/mod.ts";
import { StoreTarget } from "../services/mod.ts";
import { RoleType } from "../types/mod.ts";
import { IConfigService, IDatabaseService } from "./mod.ts";

export interface IUserStoreConstructor {
  new (
    cfg: IConfigService,
    db: IDatabaseService,
    parent: StoreTarget,
  ): IUserStore;
}

export interface IUserStore {
  init(): Promise<void>;
  /** Returns:
   * - 1 if invitation is invalid or team doesn't exist,
   * - 2 if user already exists.
   */
  add(
    where: { invitation: string } | { team: number },
    options:
      & {
        login: string;
        name: string;
        number?: number;
        role: RoleType;
        seed?: number;
      }
      & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<0 | 1 | 2>; // TODO: from auth.ts
  get(id: string): User; // returns placeholder
  delete(id: string): Promise<void>; // throws
}
