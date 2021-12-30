// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { cookieSchema, userSchema, teamSchema } from "../schemas/mod.ts";
import { ConfigService, AuthService } from "../services/mod.ts";
import { controller } from "../core/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class AuthController {
  constructor(
    private config: ConfigService,
    private authService: AuthService
  ) {}

  register = controller({
    schema: {
      body: {
        login: userSchema.loginEmail,
        name: userSchema.name,
        hashedPassword: userSchema.hashedPassword,
        number: userSchema.number,
        invitation: teamSchema.invitationRequired,
      },
    },
    status: 200,
    handle: async (_: unknown, { body }) => {
      await this.authService.register(body);
    },
  });

  login = controller({
    schema: {
      body: {
        login: userSchema.login,
        hashedPassword: userSchema.hashedPassword,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const { token } = await this.authService.login(body);
      ctx.cookies.set("token", token, { maxAge: this.config.JWT_CONF.exp });
    },
  });

  logout = controller({
    schema: {
      cookies: {
        token: cookieSchema.token,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { cookies }) => {
      await this.authService.logout(cookies);
      ctx.cookies.delete("token");
    },
  });

  //FIXME injectable router resolver
  router = new Router({
    prefix: "/auth",
  })
    .post("/register", this.register)
    .post("/login", this.login)
    .post("/logout", this.logout);
}
