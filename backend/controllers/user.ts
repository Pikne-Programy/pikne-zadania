// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { followSchema } from "../utils/oak.ts";

export class UserController {
  constructor(
    private cfg: IConfigService,
  ) {}

  readonly current = followSchema({}, async (ctx, req) => {});

  readonly delete = followSchema({}, async (ctx, req) => {});

  readonly update = followSchema({}, async (ctx, req) => {});

  readonly info = followSchema({}, async (ctx, req) => {});
}
