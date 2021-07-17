// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { User } from "../models/mod.ts";

export interface IUsers {
  delete(id: string): Promise<boolean>;
  parse(user: User): { name: string; team: number; number: number | null };
  info(
    id: string,
  ): Promise<{ name: string; team: number; number: number | null } | null>;
  /** Returns:
   * - 1 if user was not found,
   * - 2 if user is not a student and number was given.
   */
  update(id: string, number?: number, name?: string): Promise<0 | 1 | 2>;
}
