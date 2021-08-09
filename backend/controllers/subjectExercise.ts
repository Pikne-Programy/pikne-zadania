// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { followSchema } from "../utils/oak.ts";

export class SubjectExerciseController {
  constructor(
    private cfg: IConfigService,
  ) {}

  readonly list = followSchema({}, async (ctx, req) => {});

  readonly get = followSchema({}, async (ctx, req) => {});

  readonly add = followSchema({}, async (ctx, req) => {});

  readonly update = followSchema({}, async (ctx, req) => {});

  readonly preview = followSchema({}, async (ctx, req) => {});
}
