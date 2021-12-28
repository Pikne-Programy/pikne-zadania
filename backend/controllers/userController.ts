// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { userSchema } from "../schemas/mod.ts";
import { UserService } from "../services/mod.ts";
import { IAuthorizer, controller } from "../core/mod.ts";

export function UserController(
  authorize: IAuthorizer,
  userService: UserService
) {
  const findOne = controller({
    schema: {
      body: {
        //FIXME why it is even optional?
        //? send own id if want own data?
        userId: userSchema.idOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      ctx.response.body = await userService.findOne(user, body);
    },
  });

  const update = controller({
    schema: {
      body: {
        userId: userSchema.id,
        number: userSchema.numberOptional,
        name: userSchema.nameOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      userService.update(user, body);
    },
  });

  const remove = controller({
    schema: {
      body: {
        userId: userSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { userId } }) => {
      const user = await authorize(ctx);
      userService.delete(user, userId);
    },
  });

  return new Router({
    prefix: "/user",
  })
    .post("/info", findOne)
    .post("/update", update)
    .post("/delete", remove);
}
