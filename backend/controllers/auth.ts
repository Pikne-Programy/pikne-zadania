// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { followSchema, Router, RouterContext as RC } from "../utils/oak.ts";

export class AuthController {
  constructor(
    private cfg: IConfigService,
  ) {}

  async register(ctx: RC) {
    const req = await followSchema(ctx, {});
  }

  async login(ctx: RC) {
    const req = await followSchema(ctx, {});
  }

  async logout(ctx: RC) {
    const req = await followSchema(ctx, {});
  }

  readonly router = new Router()
    .post("/register", (ctx: RC) => this.register(ctx))
    .post("/login", (ctx: RC) => this.login(ctx))
    .post("/logout", (ctx: RC) => this.logout(ctx));
}
