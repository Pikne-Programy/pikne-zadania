// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { schemas } from "../types/mod.ts";
import { followSchema, Router, RouterContext as RC } from "../utils/oak.ts";

export class UserController {
  constructor(
    private cfg: IConfigService,
  ) {}

  async info(ctx: RC) {
    const req = await followSchema(ctx, {
      userId: schemas.user.idOptional,
    });
  }

  async update(ctx: RC) {
    const req = await followSchema(ctx, {
      userId: schemas.user.id,
      number: schemas.user.numberOptional,
      name: schemas.user.nameOptional,
    });
  }

  async delete(ctx: RC) {
    const req = await followSchema(ctx, {
      userId: schemas.user.id,
    });
  }

  readonly router = new Router()
    .post("/info", (ctx: RC) => this.info(ctx))
    .post("/update", (ctx: RC) => this.update(ctx))
    .post("/delete", (ctx: RC) => this.delete(ctx));
}
