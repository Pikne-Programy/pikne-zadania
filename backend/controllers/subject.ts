// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { followSchema, Router, RouterContext as RC } from "../utils/oak.ts";

export class SubjectController {
  constructor(
    private cfg: IConfigService,
  ) {}

  async list(ctx: RC) {
    const req = await followSchema(ctx, {});
  }

  async create(ctx: RC) {
    const req = await followSchema(ctx, {});
  }

  async info(ctx: RC) {
    const req = await followSchema(ctx, {});
  }

  async permit(ctx: RC) {
    const req = await followSchema(ctx, {});
  }

  readonly problem = {
    parent: this,

    async get(ctx: RC) {
      const req = await followSchema(ctx, {});
    },

    async update(ctx: RC) {
      const req = await followSchema(ctx, {});
    },
  };

  readonly static = {
    parent: this,

    async get(ctx: RC) {
      const req = await followSchema(ctx, {});
    },

    async put(ctx: RC) {
      const req = await followSchema(ctx, {});
    },
  };
  readonly hierarchy = {
    parent: this,

    async get(ctx: RC) {
      const req = await followSchema(ctx, {});
    },

    async set(ctx: RC) {
      const req = await followSchema(ctx, {});
    },
  };

  readonly exercise = {
    parent: this,

    async list(ctx: RC) {
      const req = await followSchema(ctx, {});
    },

    async get(ctx: RC) {
      const req = await followSchema(ctx, {});
    },

    async add(ctx: RC) {
      const req = await followSchema(ctx, {});
    },

    async update(ctx: RC) {
      const req = await followSchema(ctx, {});
    },

    async preview(ctx: RC) {
      const req = await followSchema(ctx, {});
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
        .post("/get", (ctx: RC) => this.exercise.get(ctx))
        .post("/add", (ctx: RC) => this.exercise.add(ctx))
        .post("/update", (ctx: RC) => this.exercise.update(ctx))
        .post("/preview", (ctx: RC) => this.exercise.preview(ctx))
        .routes(),
    );
}
