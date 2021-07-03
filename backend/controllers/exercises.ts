// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, send } from "../deps.ts";
import { exerciseSchema } from "../types/mod.ts";
import { followSchema, generateSeed, RouterContext } from "../utils/mod.ts";
import { IConfig, IExercises } from "../interfaces/mod.ts";

export class ExercisesController {
  constructor(
    private cfg: IConfig,
    private ex: IExercises,
  ) {}

  setSeed(ctx: RouterContext, seed: number) {
    ctx.state.seed = seed;
    ctx.cookies.set("seed", seed.toString(), { maxAge: this.cfg.SEED_AGE });
  }

  async seed(ctx: RouterContext, next: () => Promise<unknown>) {
    const cookie = +(ctx.cookies.get("seed") ?? NaN);
    if (ctx.state.user) this.setSeed(ctx, ctx.state.user.seed);
    else if (isNaN(cookie)) this.setSeed(ctx, generateSeed());
    else ctx.state.seed = cookie;
    await next();
  }

  async getStaticContent(ctx: RouterContext) {
    if (!ctx.params.file || !ctx.params.subject) throw new Error("never");
    await send(ctx, ctx.params.file, {
      root: this.ex.getStaticContentPath(ctx.params.subject),
    }); // there's a problem with no permission to element
  }

  list(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = this.ex.getListOf(ctx.state.user);
  }

  readonly check = followSchema({
    id: exerciseSchema.id,
    answers: exerciseSchema.answers,
  }, async (ctx, req) => {
    ctx.response.status = 200;
    ctx.response.body = await this.ex.check(
      req.id,
      req.answers,
      ctx.state.user ?? { seed: ctx.state.seed },
    );
  });

  readonly preview = followSchema({
    content: exerciseSchema.content,
    seed: exerciseSchema.seed,
  }, (ctx, req) => {
    // TODO: permissions
    // TODO: Render with correct answers
    const ex = this.ex.analyze(req.content);
    ctx.response.body = ex.render(req.seed);
    ctx.response.status = 200;
  });

  readonly render = followSchema({
    id: exerciseSchema.id,
    seed: exerciseSchema.seed,
  }, (ctx, req) => {
    // TODO: permissions
    // TODO: Render with correct answers
    const ex = this.ex.render(req.id, req.seed);
    if (!ex) throw new httpErrors["NotFound"]();
    ctx.response.body = ex;
    ctx.response.status = 200;
  });
}
