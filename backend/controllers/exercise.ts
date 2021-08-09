// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/mod.ts";
import { followSchema, RouterContext } from "../utils/mod.ts";

export class ExerciseController {
  constructor(
    private cfg: IConfigService,
  ) {}

  readonly static = async (ctx: RouterContext) => {};

  readonly list = followSchema({}, async (ctx, req) => {});

  readonly check = followSchema({}, async (ctx, req) => {});

  readonly render = followSchema({}, async (ctx, req) => {});
}
