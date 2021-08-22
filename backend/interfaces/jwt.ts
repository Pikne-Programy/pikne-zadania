// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError } from "../types/mod.ts";

export interface IJWTService {
  create(
    login: string,
    hashedPassword: string,
  ): Promise<string | CustomDictError<"UserCredentialsInvalid">>;
  resolve(jwt?: string): Promise<string | CustomDictError<"JWTNotFound">>;
  revoke(
    userId: string,
    jwt: string,
  ): Promise<void | CustomDictError<"JWTNotFound">>;
}
