// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IUser } from "./mod.ts";

export interface IJWTService {
  create(login: string, hashedPassword: string): Promise<string | null>;
  resolve(jwt?: string): Promise<IUser | null>;
  revoke(login: string, jwt: string): Promise<void>; // throws
}
