// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { delay, translateErrors } from "../utils/mod.ts";
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
    async (ctx: RouterContext, { invitation, ...rest }) => {
      translateErrors(
        await userRepository.add(
          { invitation },
          {
            ...rest,
            number: isNaN(rest.number) ? undefined : rest.number,
          }
        )
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
      const jwt = await jwtService.create(req.login, req.hashedPassword);
      const startTime = Date.now();

      if (typeof jwt !== "string") {
        const remainedTime = startTime + config.LOGIN_TIME - Date.now();

        if (remainedTime > 0) {
          await delay(remainedTime);
        } else {
          // * preventing timing attack *
          logger.warn(`WARN: Missed LOGIN_TIME by ${remainedTime} ms.`);
        }

        throw new httpErrors["Unauthorized"]();
      } //! PEVO
      ctx.cookies.set("jwt", jwt, { maxAge: config.JWT_CONF.exp });
      ctx.response.status = 200; //! D
    }
  );

  async function logout(ctx: RouterContext) {
    const jwt = ctx.cookies.get("jwt");
    const userId = translateErrors(await jwtService.resolve(jwt)); //! APE

    if (jwt === undefined) {
      throw new Error("never");
    } // * the above would throw *

    translateErrors(await jwtService.revoke(userId, jwt)); //! O

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
