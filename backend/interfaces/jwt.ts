// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { User } from "../models/mod.ts";

export interface IJWTService {
  create(login: string, hashedPassword: string): Promise<string | null>;
  resolve(jwt?: string): Promise<User | null>;
  revoke(login: string, jwt: string): Promise<void>; // throws
}
