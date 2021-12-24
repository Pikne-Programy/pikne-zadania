// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { delay } from "../utils/mod.ts";
import { schemas } from "../types/mod.ts";
import { JWTService, ConfigService, Logger } from "../services/mod.ts";
import { UserRepository } from "../repositories/mod.ts";
import { ValidatorMiddleware } from "../middlewares/mod.ts";

export function AuthController(
  config: ConfigService,
  userRepository: UserRepository,
  jwtService: JWTService,
  logger: Logger
) {
  const register = ValidatorMiddleware(
    {
      login: schemas.user.loginEmail,
      name: schemas.user.name,
      hashedPassword: schemas.user.hashedPassword,
      number: schemas.user.number,
      invitation: schemas.team.invitationRequired,
    },
    async (ctx: RouterContext, { invitation, number, ...rest }) => {
      await userRepository.add(
        { invitation },
        {
          ...rest,
          number: isNaN(number) ? undefined : number,
        }
      ); //! PEVO
      ctx.response.status = 200; //! D
    }
  );

  const login = ValidatorMiddleware(
    {
      login: schemas.user.login,
      hashedPassword: schemas.user.hashedPassword,
    },
    async (ctx: RouterContext, req) => {
      const { LOGIN_TIME: remainedTime } = config;

      const jwt = await jwtService
        .create(req.login, req.hashedPassword)
        .catch(() => {
          throw remainedTime > 0
            ? delay(remainedTime) // * preventing timing attack *
            : logger.warn(`WARN: Missed LOGIN_TIME by ${remainedTime} ms.`);
        });

      ctx.cookies.set("jwt", jwt, { maxAge: config.JWT_CONF.exp });
      ctx.response.status = 200; //! D
    }
  );

  async function logout(ctx: RouterContext) {
    const jwt = ctx.cookies.get("jwt");
    const userId = await jwtService.resolve(jwt); //! APE

    if (!jwt) {
      throw new Error("never");
    }

    await jwtService.revoke(userId, jwt);

    ctx.cookies.delete("jwt");
    ctx.response.status = 200; //! D
  }

  return new Router({
    prefix: "/auth",
  })
    .post("/register", register)
    .post("/login", login)
    .post("/logout", logout);
}
