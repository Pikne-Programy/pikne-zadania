// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Team, User } from "../models/mod.ts";

export interface IUserStore {
  init(): Promise<void>;
  /** Returns:
   * - 1 if the invitation is invalid,
   * - 2 if user already existed or db is corrupted.
   */
  add(
    where: { invitation: string } | { team: Team },
    options:
      & { login: string; name: string; number?: number }
      & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<0 | 1 | 2>; // TODO: from auth.ts
  get(id: string): Promise<User | null>;
  delete(id: string): Promise<void>; // throws
}
