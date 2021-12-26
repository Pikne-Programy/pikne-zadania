// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { delay } from "../utils/mod.ts";
import {
  cookieSchema,
  userSchema,
  // only use
  //FIXME
  teamSchema,
} from "../schemas/mod.ts";
import { JWTService, ConfigService, Logger } from "../services/mod.ts";
import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import { controller } from "../core/mod.ts";

export function AuthController(
  config: ConfigService,
  userRepository: UserRepository,
  teamRepository: TeamRepository,
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
    handle: async (_: unknown, { body: { invitation, number, ...rest } }) => {
      await userRepository.add(
        teamRepository.get(
          (await teamRepository.invitation.get(invitation)) ?? NaN
        ),
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

      const delayOnFailure = () => {
        const remainedTime = startTime + LOGIN_TIME - Date.now();
        throw remainedTime > 0 //FIXME proxy responsability?
          ? delay(remainedTime) // * preventing timing attack *
          : logger.warn(`WARN: Missed LOGIN_TIME by ${remainedTime} ms.`);
      };

      const jwt = await jwtService
        .create(login, hashedPassword)
        .catch(delayOnFailure);

      ctx.cookies.set("token", jwt, { maxAge: config.JWT_CONF.exp });
    },
  });

  const logout = controller({
    schema: {
      cookies: {
        token: cookieSchema.token,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { cookies: { token } }) => {
      const userId = await jwtService.resolve(token);

      await jwtService.revoke(userId, token);

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
