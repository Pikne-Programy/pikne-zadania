// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { FormDataBody, httpErrors, vs } from "../deps.ts";
import { IConfigService } from "../interfaces/config.ts";
import { schemas } from "../types/mod.ts";
import { followSchema, Router, RouterContext as RC } from "../utils/oak.ts";

export class SubjectController {
  constructor(
    private cfg: IConfigService,
  ) {}

  async list(ctx: RC) {
  }

  async create(ctx: RC) {
    const req = await followSchema(ctx, {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    });
  }

  async info(ctx: RC) {
    const req = await followSchema(ctx, {
      subject: schemas.exercise.subject,
    });
  }

  async permit(ctx: RC) {
    const req = await followSchema(ctx, {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    });
  }

  readonly problem = {
    parent: this,

    async get(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        seed: schemas.user.seedOptional,
      });
    },

    async update(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        answer: schemas.exercise.answer,
      });
    },
  };

  readonly static = {
    parent: this,

    async get(ctx: RC) {
    },

    async put(ctx: RC) {
      let body: FormDataBody;
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

    async get(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        raw: vs.boolean({ strictType: true }),
      });
    },

    async set(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        hierarchy: schemas.exercise.hierarchy,
      });
    },
  };

  readonly exercise = {
    parent: this,

    async list(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
      });
    },

    async add(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        content: schemas.exercise.content,
      });
    },

    async get(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
      });
    },

    async update(ctx: RC) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        content: schemas.exercise.content,
      });
    },

    async preview(ctx: RC) {
      const req = await followSchema(ctx, {
        content: schemas.exercise.content,
        seed: schemas.user.seedOptional,
      });
    },
  };

  readonly router = new Router()
    .get("/list", (ctx: RC) => this.list(ctx))
    .post("/create", (ctx: RC) => this.create(ctx))
    .post("/info", (ctx: RC) => this.info(ctx))
    .post("/permit", (ctx: RC) => this.permit(ctx))
    .use(
      "/problem",
      new Router()
        .post("/get", (ctx: RC) => this.problem.get(ctx))
        .post("/update", (ctx: RC) => this.problem.update(ctx))
        .routes(),
    ).use(
      "/static",
      new Router()
        .get("/:subject/:filename", (ctx: RC) => this.static.get(ctx))
        .put("/:subject/:filename", (ctx: RC) => this.static.put(ctx))
        .routes(),
    ).use(
      "/hierarchy",
      new Router()
        .post("/get", (ctx: RC) => this.hierarchy.get(ctx))
        .post("/set", (ctx: RC) => this.hierarchy.set(ctx))
        .routes(),
    ).use(
      "/exercise",
      new Router()
        .post("/list", (ctx: RC) => this.exercise.list(ctx))
        .post("/add", (ctx: RC) => this.exercise.add(ctx))
        .post("/get", (ctx: RC) => this.exercise.get(ctx))
        .post("/update", (ctx: RC) => this.exercise.update(ctx))
        .post("/preview", (ctx: RC) => this.exercise.preview(ctx))
        .routes(),
    );
}
