// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import { exerciseSchema, subjectSchema } from "../schemas/mod.ts";
import { SubjectService } from "../services/mod.ts";
import { controller } from "../core/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";
import { Authorizer } from "./mod.ts";

@Injectable()
export class SubjectController {
  constructor(
    private authorizer: Authorizer,
    private subjectService: SubjectService,
  ) {}

  findOne = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      ctx.response.body = await this.subjectService.findOne(user, body);
    },
  });

  findAll = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await this.authorizer.auth(ctx, false);
      ctx.response.body = await this.subjectService.findAll(user);
    },
  });

  create = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        assignees: subjectSchema.assignees,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      await this.subjectService.create(user, body);
    },
  });

  permit = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        assignees: subjectSchema.assignees,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      await this.subjectService.permit(user, body);
    },
  });

  getStatic = controller({
    schema: {
      params: {
        subject: vs.string({ strictType: true }),
        filename: vs.string({ strictType: true }),
      },
    },
    handle: async (ctx: RouterContext, { params }) => {
      const user = await this.authorizer.auth(ctx, false);
      const path = await this.subjectService.getStaticPath(user, params);
      await send(ctx, params.filename, path); // there's a problem with no permission to element
    },
  });

  putStatic = controller({
    schema: {
      params: {
        subject: vs.string({ strictType: true }),
        filename: vs.string({ strictType: true }),
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { params }) => {
      const user = await this.authorizer.auth(ctx);

      const maxSize = 100 * 2 ** 20; // 100 MiB
      const body = await ctx.request.body({ type: "form-data" }).value.read({
        maxFileSize: maxSize,
        maxSize,
      });
      //FIXME validate files
      if (!(body.files?.length == 1 && body.files[0].content)) {
        throw new httpErrors["BadRequest"]();
      }

      await this.subjectService.putStatic(user, params, body.files[0].content);
    },
  });

  getHierarchy = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        raw: vs.boolean({ strictType: true }),
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx, false);
      ctx.response.body = await this.subjectService.getHierarchy(user, body);
    },
  });

  setHierarchy = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        hierarchy: exerciseSchema.hierarchy,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      this.subjectService.setHierarchy(user, body);
    },
  });

  router = new Router({
    prefix: "/subject",
  })
    .get("/list", this.findAll)
    .post("/create", this.create)
    .post("/info", this.findOne)
    .post("/permit", this.permit)
    .use(
      "/static",
      new Router()
        .get("/:subject/:filename", this.getStatic)
        .put("/:subject/:filename", this.putStatic)
        .routes(),
    )
    .use(
      "/hierarchy",
      new Router()
        .post("/get", this.getHierarchy)
        .post("/set", this.setHierarchy)
        .routes(),
    );
}
