// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { ConfigService, ProblemService } from "../services/mod.ts";
import { controller } from "../core/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";
import { Authorizer } from "./mod.ts";

@Injectable()
export class ProblemController {
  constructor(
    private authorizer: Authorizer,
    private config: ConfigService,
    private problemService: ProblemService,
  ) {}

  get = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        seed: userSchema.seedOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx, false);
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

  update = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        answer: exerciseSchema.answer,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx, false);
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

  router = new Router({
    prefix: "/subject/problem",
  })
    .post("/get", this.get)
    .post("/update", this.update);
}
