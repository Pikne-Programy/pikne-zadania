// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { schemas } from "../types/mod.ts";
import { followSchema, Router, RouterContext as RC } from "../utils/oak.ts";

export class AuthController {
  constructor(
    private cfg: IConfigService,
  ) {}

  async register(ctx: RC) {
    const req = await followSchema(ctx, {
      login: schemas.user.loginEmail,
      name: schemas.user.name,
      hashedPassword: schemas.user.hashedPassword,
      number: schemas.user.number,
      invitation: schemas.team.invitationRequired,
    });
  }

  async login(ctx: RC) {
    const req = await followSchema(ctx, {
      login: schemas.user.login,
      name: schemas.user.name,
    });
  }

  async logout(ctx: RC) {
  }

  readonly router = new Router()
    .post("/register", (ctx: RC) => this.register(ctx))
    .post("/login", (ctx: RC) => this.login(ctx))
    .post("/logout", (ctx: RC) => this.logout(ctx));
}
