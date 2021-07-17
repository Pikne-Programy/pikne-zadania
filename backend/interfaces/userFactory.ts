// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOmit } from "../types/mod.ts";
import { UserType } from "../types/mod.ts";
import { User } from "../models/mod.ts";

export interface IUserFactory {
  invitations: { [key: string]: number };
  get(id: string, lock?: symbol): Promise<User | null>;
  add(part: IdOmit<UserType>, lock?: symbol): Promise<string | null>;
  delete(id: string, lock?: symbol): Promise<boolean>;
}
