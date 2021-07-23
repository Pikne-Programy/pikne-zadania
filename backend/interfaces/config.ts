// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Algorithm } from "../deps.ts";

export interface IConfigService {
  readonly SEED_AGE: number;
  readonly LOGIN_TIME: number;
  readonly USER_SALT: string;
  readonly RNG_PREC: number;
  readonly ANSWER_PREC: number;
  readonly DECIMAL_POINT: boolean;
  readonly JWT_CONF: {
    exp: number;
    header: { alg: Algorithm; typ: "JWT" };
    key: string;
  };
  readonly MONGO_CONF: { db: string; url: string; time: number };
  readonly ROOT_CONF: {
    enable: boolean;
    password?: string;
    dhPassword?: string;
  };
  hash(login: string): string;
}
