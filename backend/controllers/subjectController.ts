// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import { exerciseSchema, subjectSchema } from "../schemas/mod.ts";
import { SubjectService } from "../services/mod.ts";
import { TokenAuthController } from "./auth/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class SubjectController {
  constructor(
    private controller: TokenAuthController,
    private subjectService: SubjectService,
  ) {}

  findOne() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
        },
      },
      auth: true,
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        ctx.response.body = await this.subjectService.findOne(user, body);
      },
    });
  }

  findAll() {
    return this.controller.route({
      status: 200,
      auth: { isOptional: true },
      handle: async (ctx: RouterContext, { user }) => {
        ctx.response.body = await this.subjectService.findAll(user);
      },
    });
  }

  create() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          assignees: subjectSchema.assignees,
        },
      },
      auth: true,
      status: 200,
      handle: async (_: RouterContext, { body, user }) => {
        await this.subjectService.create(user, body);
      },
    });
  }

  permit() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          assignees: subjectSchema.assignees,
        },
      },
      auth: true,
      status: 200,
      handle: async (_: RouterContext, { body, user }) => {
        await this.subjectService.permit(user, body);
      },
    });
  }

  getStatic() {
    return this.controller.route({
      schema: {
        params: {
          subject: vs.string({ strictType: true }),
          filename: vs.string({ strictType: true }),
        },
      },
      auth: { isOptional: true },
      handle: async (ctx: RouterContext, { params, user }) => {
        const path = await this.subjectService.getStaticPath(user, params);
        await send(ctx, params.filename, path); // there's a problem with no permission to element
      },
    });
  }

  putStatic() {
    return this.controller.route({
      schema: {
        params: {
          subject: vs.string({ strictType: true }),
          filename: vs.string({ strictType: true }),
        },
      },
      auth: true,
      status: 200,
      handle: async (ctx: RouterContext, { params, user }) => {
        const maxSize = 100 * 2 ** 20; // 100 MiB
        const body = await ctx.request.body({ type: "form-data" }).value.read({
          maxFileSize: maxSize,
          maxSize,
        });
        //FIXME validate files
        if (!(body.files?.length == 1 && body.files[0].content)) {
          throw new httpErrors["BadRequest"]();
        }

        await this.subjectService.putStatic(
          user,
          params,
          body.files[0].content,
        );
      },
    });
  }

  getHierarchy() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          raw: vs.boolean({ strictType: true }),
        },
      },
      auth: { isOptional: true },
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        ctx.response.body = await this.subjectService.getHierarchy(user, body);
      },
    });
  }

  setHierarchy() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          hierarchy: exerciseSchema.hierarchy,
        },
      },
      auth: true,
      status: 200,
      handle: (_: RouterContext, { body, user }) => {
        this.subjectService.setHierarchy(user, body);
      },
    });
  }

  router = () =>
    new Router({
      prefix: "/subject",
    })
      .get("/list", this.findAll())
      .post("/create", this.create())
      .post("/info", this.findOne())
      .post("/permit", this.permit())
      .use(
        "/static",
        new Router()
          .get("/:subject/:filename", this.getStatic())
          .put("/:subject/:filename", this.putStatic())
          .routes(),
      )
      .use(
        "/hierarchy",
        new Router()
          .post("/get", this.getHierarchy())
          .post("/set", this.setHierarchy())
          .routes(),
      );
}
