// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { delay } from "../utils/mod.ts";
import {
  userSchema,
  // line 27 only use
  //FIXME
  teamSchema,
} from "../schemas/mod.ts";
import { JWTService, ConfigService, Logger } from "../services/mod.ts";
import { UserRepository } from "../repositories/mod.ts";
import { controller } from "../core/mod.ts";

export function AuthController(
  config: ConfigService,
  userRepository: UserRepository,
  jwtService: JWTService,
  logger: Logger
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
    handle: async (
      _ctx: RouterContext,
      { body: { invitation, number, ...rest } }
    ) => {
      await userRepository.add(
        { invitation },
        {
          ...rest,
          number: isNaN(number) ? undefined : number,
        }
      );
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
    handle: async (ctx: RouterContext, { body: { hashedPassword, login } }) => {
      const { LOGIN_TIME } = config;
      const startTime = Date.now();

      const jwt = await jwtService.create(login, hashedPassword).catch(() => {
        const remainedTime = startTime + LOGIN_TIME - Date.now();
        throw remainedTime > 0
          ? delay(remainedTime) // * preventing timing attack *
          : logger.warn(`WARN: Missed LOGIN_TIME by ${remainedTime} ms.`);
      });

      ctx.cookies.set("jwt", jwt, { maxAge: config.JWT_CONF.exp });
    },
  });

  const logout = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const jwt = ctx.cookies.get("jwt");
      const userId = await jwtService.resolve(jwt); //! APE

      if (!jwt) {
        throw new Error("never"); //FIXME TODO jwt cookie schema
      }

      await jwtService.revoke(userId, jwt);

      ctx.cookies.delete("jwt");
    },
  });

  return new Router({
    prefix: "/auth",
  })
    .post("/register", register)
    .post("/login", login)
    .post("/logout", logout);
}
