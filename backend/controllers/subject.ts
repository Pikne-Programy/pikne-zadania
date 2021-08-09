// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { followSchema } from "../utils/oak.ts";

export class SubjectController {
  constructor(
    private cfg: IConfigService,
  ) {}

  readonly list = followSchema({}, async (ctx, req) => {});

  readonly create = followSchema({}, async (ctx, req) => {});

  readonly info = followSchema({}, async (ctx, req) => {});

  readonly permit = followSchema({}, async (ctx, req) => {});
}
