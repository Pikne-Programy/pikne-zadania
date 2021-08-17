// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import {
  followSchema,
  generateSeed,
  joinThrowable,
  translateErrors,
} from "../utils/mod.ts";
import { schemas } from "../types/mod.ts";
import {
  IConfigService,
  IExerciseService,
  IExerciseStore,
  IJWTService,
  ISubjectStore,
  IUser,
  IUserStore,
} from "../interfaces/mod.ts";
import { Authorizer } from "./mod.ts";

export class SubjectController extends Authorizer {
  constructor(
    protected cfg: IConfigService,
    protected jwt: IJWTService,
    protected us: IUserStore,
    protected ss: ISubjectStore,
    protected es: IExerciseStore,
    protected ex: IExerciseService,
  ) {
    super(jwt, us);
  }

  async list(ctx: RouterContext) {
  }

  async create(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    });
  }

  async info(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      subject: schemas.exercise.subject,
    });
  }

  async permit(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    });
  }

  readonly problem = {
    parent: this,

    async get(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        seed: schemas.user.seedOptional,
      });
    },

    async update(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        answer: schemas.exercise.answer,
      });
    },
  };

  readonly static = {
    parent: this,

    async get(ctx: RouterContext) {
    },

    async put(ctx: RouterContext) {
      let body;
      try {
        body = await ctx.request.body({ type: "form-data" }).value.read({
          maxFileSize: 100 * 2 ** 20, // 100 MiB
          // TODO: move to config
          // maxSize?
        });
        if (body.files === undefined || body.files.length != 1) throw "";
      } catch (_) {
        throw new httpErrors["BadRequest"]();
      }
    },
  };
  readonly hierarchy = {
    parent: this,

    async get(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        raw: vs.boolean({ strictType: true }),
      });
    },

    async set(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        hierarchy: schemas.exercise.hierarchy,
      });
    },
  };

  readonly exercise = {
    parent: this,

    async list(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
      });
    },

    async add(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        content: schemas.exercise.content,
      });
    },

    async get(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
      });
    },

    async update(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        content: schemas.exercise.content,
      });
    },

    async preview(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        content: schemas.exercise.content,
        seed: schemas.user.seedOptional,
      });
    },
  };

  readonly router = new Router()
    .get("/list", (ctx: RouterContext) => this.list(ctx))
    .post("/create", (ctx: RouterContext) => this.create(ctx))
    .post("/info", (ctx: RouterContext) => this.info(ctx))
    .post("/permit", (ctx: RouterContext) => this.permit(ctx))
    .use(
      "/problem",
      new Router()
        .post("/get", (ctx: RouterContext) => this.problem.get(ctx))
        .post("/update", (ctx: RouterContext) => this.problem.update(ctx))
        .routes(),
    ).use(
      "/static",
      new Router()
        .get(
          "/:subject/:filename",
          (ctx: RouterContext) => this.static.get(ctx),
        )
        .put(
          "/:subject/:filename",
          (ctx: RouterContext) => this.static.put(ctx),
        )
        .routes(),
    ).use(
      "/hierarchy",
      new Router()
        .post("/get", (ctx: RouterContext) => this.hierarchy.get(ctx))
        .post("/set", (ctx: RouterContext) => this.hierarchy.set(ctx))
        .routes(),
    ).use(
      "/exercise",
      new Router()
        .post("/list", (ctx: RouterContext) => this.exercise.list(ctx))
        .post("/add", (ctx: RouterContext) => this.exercise.add(ctx))
        .post("/get", (ctx: RouterContext) => this.exercise.get(ctx))
        .post("/update", (ctx: RouterContext) => this.exercise.update(ctx))
        .post("/preview", (ctx: RouterContext) => this.exercise.preview(ctx))
        .routes(),
    );
}
