// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, vs } from "../deps.ts";
import { teamSchema, userSchema } from "../types/mod.ts";
import {
  delay,
  followSchema,
  handleThrown,
  RouterContext,
} from "../utils/mod.ts";
import { IAuth, IConfig } from "../interfaces/mod.ts";

export class AuthController {
  constructor(
    private cfg: IConfig,
    private auth: IAuth,
  ) {}

  authorize(required: boolean) {
    return async (ctx: RouterContext, next: () => Promise<unknown>) => {
      const jwt = ctx.cookies.get("jwt");
      ctx.state.user = await this.auth.resolve(jwt);
      if (ctx.state.user == null) ctx.cookies.delete("jwt");
      if (required && !ctx.state.user) throw new httpErrors["Forbidden"]();
      await next();
    };
  }

  readonly login = followSchema({
    login: userSchema.login,
    hashedPassword: userSchema.hpassword,
  }, async (ctx, req) => {
    const startTime = Date.now();
    try {
      const jwt = await this.auth.login(req.login, req.hashedPassword);
      if (jwt !== null) {
        ctx.cookies.set("jwt", jwt);
        ctx.response.status = 200;
      } else {
        const remainedTime = startTime + this.cfg.LOGIN_TIME - Date.now();
        if (remainedTime > 0) await delay(remainedTime); // preventing timing attack
        else console.error(`Missed LOGIN_TIME by ${remainedTime} ms.`);
        ctx.response.status = 401;
      }
    } catch (e) {
      handleThrown(e);
      throw new httpErrors["Unauthorized"]();
    }
    const time = Date.now() - startTime;
    console.log(`login: ${req.login} ${ctx.response.status} ${time} ms`);
  });

  async logout(ctx: RouterContext) {
    const user = ctx.state.user?.id;
    if (!user) throw new httpErrors["Forbidden"]();
    const jwt = ctx.cookies.get("jwt") ?? "";
    await this.auth.logout(user, jwt);
    ctx.cookies.delete("jwt");
    ctx.response.status = 200;
    console.log(`logout: ${user} ${ctx.response.status}`);
  }

  readonly register = followSchema({
    login: vs.email(),
    name: userSchema.nameReq,
    hashedPassword: userSchema.hpassword,
    number: userSchema.number,
    invitation: teamSchema.invitation,
  }, async (ctx, req) => {
    switch (await this.auth.register(req as any)) { // TODO
      case 1:
        throw new httpErrors["Forbidden"]();
      case 2:
        throw new httpErrors["Conflict"]();
    }
    ctx.response.status = 201;
    console.log(`register: ${req.name}`);
  });
}
