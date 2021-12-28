// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { ConfigService, ProblemService } from "../services/mod.ts";
import { IAuthorizer, controller } from "../core/mod.ts";

export function ProblemController(
  authorize: IAuthorizer,
  config: ConfigService,
  problemService: ProblemService
) {
  const get = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        seed: userSchema.seedOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx, false);
      const { seed, response } = await problemService.get(user, {
        ...body,
        otherSeed: ctx.cookies.get("seed"),
      });
      ctx.cookies.set("seed", seed?.toString() ?? null, {
        maxAge: config.SEED_AGE,
      });
      ctx.response.body = response;
    },
  });

  const update = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        answer: exerciseSchema.answer,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx, false);
      const { seed, response } = await problemService.update(user, {
        ...body,
        otherSeed: ctx.cookies.get("seed"),
      });
      ctx.cookies.set("seed", seed?.toString() ?? null, {
        maxAge: config.SEED_AGE,
      });
      ctx.response.body = response; // ? done, correctAnswer ?
    },
  });

  return new Router({
    prefix: "/subject/problem",
  })
    .post("/get", get)
    .post("/update", update);
}
