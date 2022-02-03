// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { ConfigService, ProblemService } from "../services/mod.ts";
import { TokenAuthController } from "./auth/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class ProblemController {
  constructor(
    private controller: TokenAuthController,
    private config: ConfigService,
    private problemService: ProblemService
  ) {}

  // FIXME wrapping
  // probably updating TS version should work 4.3.2 -> 4.3.5
  get() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          exerciseId: exerciseSchema.id,
          seed: userSchema.seedOptional,
        },
      },
      auth: "optional",
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        const { seed, response } = await this.problemService.get(user, {
          ...body,
          otherSeed: ctx.cookies.get("seed"),
        });
        ctx.cookies.set("seed", seed?.toString() ?? null, {
          maxAge: this.config.SEED_AGE,
        });
        ctx.response.body = response;
      },
    });
  }

  update() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          exerciseId: exerciseSchema.id,
          answer: exerciseSchema.answer,
        },
      },
      auth: "optional",
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        const { seed, response } = await this.problemService.update(user, {
          ...body,
          otherSeed: ctx.cookies.get("seed"),
        });
        ctx.cookies.set("seed", seed?.toString() ?? null, {
          maxAge: this.config.SEED_AGE,
        });
        ctx.response.body = response; // ? done, correctAnswer ?
      },
    });
  }

  router = () =>
    new Router({
      prefix: "/subject/problem",
    })
      .post("/get", this.get())
      .post("/update", this.update());
}
