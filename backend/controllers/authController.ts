// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext, delay } from "../deps.ts";
import { cookieSchema, userSchema, teamSchema } from "../schemas/mod.ts";
import {
  JWTService,
  ConfigService,
  Logger,
  HashService,
} from "../services/mod.ts";
import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import { controller } from "../core/mod.ts";
import { CustomDictError } from "../common/mod.ts";
import { generateSeed } from "../utils/mod.ts";

export function AuthController(
  config: ConfigService,
  userRepository: UserRepository,
  teamRepository: TeamRepository,
  jwtService: JWTService,
  logger: Logger,
  hashService: HashService
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
      _: unknown,
      { body: { invitation, number, hashedPassword, login, name } }
    ) => {
      const team = await teamRepository.collection.findOne({ invitation });
      if (!team) {
        throw new CustomDictError("TeamInvitationNotFound", {});
      }
      const id = hashService.hash(login);
      const user = {
        id,
        login,
        name,
        number,
        team: team.id,
        dhPassword: await hashService.secondhash(hashedPassword),
        role: "student", //? FIXME should it be teacher if admin team
        seed: generateSeed(),
        tokens: [],
        exercises: {},
      };
      if (await userRepository.get(id)) {
        throw new CustomDictError("UserAlreadyExists", { userId: id });
      }

      await userRepository.collection.insertOne(user);

      // admin team
      if (team.id !== 0) {
        await teamRepository.arrayPush(team, "members", id);
      }
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
      const user = await jwtService.resolve(token);

      await jwtService.revoke(user, token);

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
