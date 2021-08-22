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
    const { invitation, ...rest } = await followSchema(ctx, {
      login: schemas.user.loginEmail,
      name: schemas.user.name,
      hashedPassword: schemas.user.hashedPassword,
      number: schemas.user.number,
      invitation: schemas.team.invitationRequired,
    }); //! R
    translateErrors(await this.us.add({ invitation }, rest)); //! PEVO
    ctx.response.status = 200; //! D
  }

  async login(ctx: RouterContext) {
    const startTime = Date.now();
    const req = await followSchema(ctx, {
      login: schemas.user.login,
      hashedPassword: schemas.user.hashedPassword,
    }); //! R
    const jwt = await this.jwt.create(req.login, req.hashedPassword);
    if (typeof jwt !== "string") {
      const remainedTime = startTime + this.cfg.LOGIN_TIME - Date.now();
      if (remainedTime > 0) await delay(remainedTime); // * preventing timing attack *
      else if (this.cfg.VERBOSITY >= 2) {
        console.warn(`WARN: Missed LOGIN_TIME by ${remainedTime} ms.`);
      }
      throw new httpErrors["Unauthorized"]();
    } //! PEVO
    ctx.cookies.set("jwt", jwt, { maxAge: this.cfg.JWT_CONF.exp });
    ctx.response.status = 200; //! D
  }

  async logout(ctx: RouterContext) {
    const jwt = ctx.cookies.get("jwt");
    const userId = translateErrors(await this.jwt.resolve(jwt)); //! APE
    if (jwt === undefined) throw new Error("never"); // * the above would throw *
    translateErrors(await this.jwt.revoke(userId, jwt)); //! O
    ctx.cookies.delete("jwt");
    ctx.response.status = 200; //! D
  }

  readonly router = new Router()
    .post("/register", (ctx: RouterContext) => this.register(ctx))
    .post("/login", (ctx: RouterContext) => this.login(ctx))
    .post("/logout", (ctx: RouterContext) => this.logout(ctx));
}
