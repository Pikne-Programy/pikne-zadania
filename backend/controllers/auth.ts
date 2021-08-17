// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { delay, followSchema, translateErrors } from "../utils/mod.ts";
import { schemas } from "../types/mod.ts";
import { IConfigService, IJWTService, IUserStore } from "../interfaces/mod.ts";

export class AuthController {
  constructor(
    private cfg: IConfigService,
    private us: IUserStore,
    private jwt: IJWTService,
  ) {}

  async register(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      login: schemas.user.loginEmail,
      name: schemas.user.name,
      hashedPassword: schemas.user.hashedPassword,
      number: schemas.user.number,
      invitation: schemas.team.invitationRequired,
    });
  }

  async login(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      login: schemas.user.login,
      name: schemas.user.name,
    });
  }

  async logout(ctx: RouterContext) {
  }

  readonly router = new Router()
    .post("/register", (ctx: RouterContext) => this.register(ctx))
    .post("/login", (ctx: RouterContext) => this.login(ctx))
    .post("/logout", (ctx: RouterContext) => this.logout(ctx));
}
