// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { userSchema } from "../schemas/mod.ts";
import { UserService } from "../services/mod.ts";
import { controller } from "../core/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";
import { Authorizer } from "./mod.ts";

@Injectable()
export class UserController {
  constructor(
    private authorizer: Authorizer,
    private userService: UserService,
  ) {}

  findOne = controller({
    schema: {
      body: {
        //FIXME why it is even optional?
        //? send own id if want own data?
        userId: userSchema.idOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      ctx.response.body = await this.userService.findOne(user, body);
    },
  });

  update = controller({
    schema: {
      body: {
        userId: userSchema.id,
        number: userSchema.numberOptional,
        name: userSchema.nameOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      this.userService.update(user, body);
    },
  });

  remove = controller({
    schema: {
      body: {
        userId: userSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { userId } }) => {
      const user = await this.authorizer.auth(ctx);
      this.userService.delete(user, userId);
    },
  });

  router = new Router({
    prefix: "/user",
  })
    .post("/info", this.findOne)
    .post("/update", this.update)
    .post("/delete", this.remove);
}
