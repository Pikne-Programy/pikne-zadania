// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RouterContext } from "../deps.ts";
import { User } from "../models/mod.ts";
import { JWTService } from "../services/mod.ts";

export interface IAuthorizer {
  (ctx: RouterContext): Promise<User>;
  (ctx: RouterContext, req: true): Promise<User>;
  (ctx: RouterContext, req: false): Promise<User | undefined>;
}

export const createAuthorize = (jwtService: JWTService) =>
  (async (ctx: RouterContext, req = true) => {
    const jwt = ctx.cookies.get("token");

    try {
      return await jwtService.resolve(jwt);
    } catch (error) {
      ctx.cookies.delete("token");

      if (req) {
        throw error;
      } else {
        return;
      }
    }
  }) as IAuthorizer;
