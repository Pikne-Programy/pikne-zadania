// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors } from "../deps.ts";
import { userSchema } from "../types/mod.ts";
import { followSchema, RouterContext } from "../utils/mod.ts";
import { IUsers } from "../interfaces/mod.ts";

export class UsersController {
  constructor(
    private users: IUsers,
  ) {}

  readonly deleteUser = followSchema(
    { id: userSchema.id },
    async (ctx, req) => {
      if (!await this.users.delete(req.id)) throw new httpErrors["NotFound"]();
      ctx.response.status = 204;
    },
  );

  readonly current = (ctx: RouterContext) => {
    ctx.response.status = 200;
    ctx.response.body = this.users.parse(ctx.state.user!);
  };

  readonly userInfo = followSchema(
    { id: userSchema.id },
    async (ctx, req) => {
      const res = await this.users.info(req.id);
      if (!res) throw new httpErrors["NotFound"]();
      ctx.response.status = 200;
      ctx.response.body = res;
    },
  );

  readonly updateUser = followSchema({
    id: userSchema.id,
    number: userSchema.number, // TODO: shouldn't be optional?
    name: userSchema.name,
  }, async (ctx, req) => {
    switch (
      await this.users.update(req.id, req.number, req.name ?? undefined)
    ) {
      case 1:
        throw new httpErrors["NotFound"]();
      case 2:
        console.error("only student can have a number");
        throw new httpErrors["Forbidden"]();
    }
    ctx.response.status = 200;
  });
}
