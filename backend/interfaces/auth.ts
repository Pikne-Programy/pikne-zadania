// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UserType } from "../types/mod.ts";

export interface IAuth {
  resolve(jwt?: string): Promise<UserType | null>;
  login(login: string, hashedPassword: string): Promise<string | null>;
  logout(login: string, jwt: string): Promise<boolean>;
  /** Returns:
   * - 1 if the invitation is invalid,
   * - 2 if user already existed or db is corrupted.
   */
  register(
    options: {
      login: string;
      name: string;
      hashedPassword: string;
      number: number;
      invitation: string;
    },
  ): Promise<0 | 1 | 2>;
}
