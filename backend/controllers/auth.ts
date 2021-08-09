// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { followSchema } from "../utils/oak.ts";

export class AuthController {
  constructor(
    private cfg: IConfigService,
  ) {}

  readonly register = followSchema({}, async (ctx, req) => {});

  readonly login = followSchema({}, async (ctx, req) => {});

  readonly logout = followSchema({}, async (ctx, req) => {});
}
