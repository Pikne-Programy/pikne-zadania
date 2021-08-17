// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { followSchema, translateErrors } from "../utils/mod.ts";
import { schemas } from "../types/mod.ts";
import {
  IJWTService,
  ITeamStore,
  IUser,
  IUserStore,
} from "../interfaces/mod.ts";
import { Authorizer } from "./mod.ts";

export class UserController extends Authorizer {
  constructor(
    protected jwt: IJWTService,
    protected us: IUserStore,
    protected ts: ITeamStore,
  ) {
    super(jwt, us);
  }

  async info(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      userId: schemas.user.idOptional,
    });
  }

  async update(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      userId: schemas.user.id,
      number: schemas.user.numberOptional,
      name: schemas.user.nameOptional,
    });
  }

  async delete(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      userId: schemas.user.id,
    });
  }

  readonly router = new Router()
    .post("/info", (ctx: RouterContext) => this.info(ctx))
    .post("/update", (ctx: RouterContext) => this.update(ctx))
    .post("/delete", (ctx: RouterContext) => this.delete(ctx));
}
