// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { cookieSchema, userSchema, teamSchema } from "../schemas/mod.ts";
import { ConfigService, AuthService } from "../services/mod.ts";
import { controller } from "../core/mod.ts";

export function AuthController(
  config: ConfigService,
  authService: AuthService
) {
  const register = controller({
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
      await authService.register(body);
    },
  });

  const login = controller({
    schema: {
      body: {
        login: userSchema.login,
        hashedPassword: userSchema.hashedPassword,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const { token } = await authService.login(body);
      ctx.cookies.set("token", token, { maxAge: config.JWT_CONF.exp });
    },
  });

  const logout = controller({
    schema: {
      cookies: {
        token: cookieSchema.token,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { cookies }) => {
      await authService.logout(cookies);
      ctx.cookies.delete("token");
    },
  });

  return new Router({
    prefix: "/auth",
  })
    .post("/register", register)
    .post("/login", login)
    .post("/logout", logout);
}
