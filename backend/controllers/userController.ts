// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { userSchema } from "../schemas/mod.ts";
import { UserService } from "../services/mod.ts";
import { TokenAuthController } from "./auth/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class UserController {
  constructor(
    private controller: TokenAuthController,
    private userService: UserService,
  ) {}

  findOne() {
    return this.controller.route({
      schema: {
        body: {
          userId: userSchema.idOptional,
        },
      },
      auth: true,
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        ctx.response.body = await this.userService.findOne(user, body);
      },
    });
  }

  update() {
    return this.controller.route({
      schema: {
        body: {
          userId: userSchema.id,
          number: userSchema.numberOptional,
          name: userSchema.nameOptional,
        },
      },
      auth: true,
      status: 200,
      handle: (_: RouterContext, { body, user }) => {
        this.userService.update(user, body);
      },
    });
  }

  remove() {
    return this.controller.route({
      schema: {
        body: {
          userId: userSchema.id,
        },
      },
      auth: true,
      status: 200,
      handle: (_: RouterContext, { body: { userId }, user }) => {
        this.userService.delete(user, userId);
      },
    });
  }

  router = () =>
    new Router({
      prefix: "/user",
    })
      .post("/info", this.findOne())
      .post("/update", this.update())
      .post("/delete", this.remove());
}
