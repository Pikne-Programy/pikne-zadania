// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOmit, IdRequired, UserType } from "../types/mod.ts";

export interface IUser {
  hash(login: string): string;
  get(id: string, lock?: symbol): Promise<UserType | null>;
  add(part: IdOmit<UserType>, lock?: symbol): Promise<string | null>;
  delete(id: string, lock?: symbol): Promise<boolean>;
  set(
    part: Omit<IdRequired<UserType>, "email">,
    lock?: symbol,
  ): Promise<boolean>;
  addJWT(id: string, jwt: string, lock?: symbol): Promise<boolean>;
  existsJWT(id: string, jwt: string, lock?: symbol): Promise<boolean>;
  deleteJWT(id: string, jwt: string, lock?: symbol): Promise<boolean>;
}
