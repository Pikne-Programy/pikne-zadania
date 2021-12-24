// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RouterContext } from "../deps.ts";
import { assertUnreachable, translateErrors } from "../utils/mod.ts";
import { CustomDictError } from "../types/mod.ts";
import { User } from "../models/mod.ts";
import { JWTService } from "../services/mod.ts";
import { UserRepository } from "../repositories/mod.ts";

export interface IAuthorizer {
  (ctx: RouterContext): Promise<User>;
  (ctx: RouterContext, req: true): Promise<User>;
  (ctx: RouterContext, req: false): Promise<User | undefined>;
}

export const createAuthorize = (
  jwtService: JWTService,
  userRepository: UserRepository
) =>
  (async (ctx: RouterContext, req = true) => {
    const jwt = ctx.cookies.get("jwt");
    const userId = await jwtService.resolve(jwt);

    if (!(userId instanceof CustomDictError)) {
      return userRepository.get(userId);
    }

    if (userId.type !== "JWTNotFound") {
      assertUnreachable(userId.type);
    }

    ctx.cookies.delete("jwt");

    if (req) {
      throw new Error(`never: ${translateErrors(userId)}`);
    }
  }) as IAuthorizer;
