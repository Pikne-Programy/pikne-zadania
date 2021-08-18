// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RouterContext } from "../deps.ts";
import { assertUnreachable, translateErrors } from "../utils/mod.ts";
import { CustomDictError } from "../types/mod.ts";
import { IJWTService, IUser, IUserStore } from "../interfaces/mod.ts";

export class Authorizer {
  constructor(
    protected jwt: IJWTService,
    protected us: IUserStore,
  ) {}

  protected async authorize(ctx: RouterContext): Promise<IUser>;
  protected async authorize(ctx: RouterContext, req: true): Promise<IUser>;
  protected async authorize(
    ctx: RouterContext,
    req: false,
  ): Promise<IUser | undefined>;
  protected async authorize(ctx: RouterContext, req = true) {
    const jwt = ctx.cookies.get("jwt");
    const userId = await this.jwt.resolve(jwt);
    if (!(userId instanceof CustomDictError)) return this.us.get(userId);
    if (userId.type !== "JWTNotFound") assertUnreachable(userId.type);
    if (req) throw translateErrors(userId);
    ctx.cookies.delete("jwt");
  }
}
