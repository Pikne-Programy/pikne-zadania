// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import { exerciseSchema, subjectSchema } from "../schemas/mod.ts";
import { SubjectService } from "../services/mod.ts";
import { IAuthorizer, controller } from "../core/mod.ts";

export function SubjectController(
  authorize: IAuthorizer,
  subjectService: SubjectService
) {
  const findOne = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      ctx.response.body = await subjectService.findOne(user, body);
    },
  });

  const findAll = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await authorize(ctx, false);
      ctx.response.body = await subjectService.findAll(user);
    },
  });

  const create = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        assignees: subjectSchema.assignees,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      await subjectService.create(user, body);
    },
  });

  const permit = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        assignees: subjectSchema.assignees,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      await subjectService.permit(user, body);
    },
  });

  const getStatic = controller({
    schema: {
      params: {
        subject: vs.string({ strictType: true }),
        filename: vs.string({ strictType: true }),
      },
    },
    handle: async (ctx: RouterContext, { params }) => {
      const user = await authorize(ctx, false);
      const path = await subjectService.getStaticPath(user, params);
      await send(ctx, params.filename, path); // there's a problem with no permission to element
    },
  });

  const putStatic = controller({
    schema: {
      params: {
        subject: vs.string({ strictType: true }),
        filename: vs.string({ strictType: true }),
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { params }) => {
      const user = await authorize(ctx);

      const maxSize = 100 * 2 ** 20; // 100 MiB
      const body = await ctx.request.body({ type: "form-data" }).value.read({
        maxFileSize: maxSize,
        maxSize,
      });
      //FIXME validate files
      if (!(body.files?.length == 1 && body.files[0].content)) {
        throw new httpErrors["BadRequest"]();
      }

      await subjectService.putStatic(user, params, body.files[0].content);
    },
  });

  const getHierarchy = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        raw: vs.boolean({ strictType: true }),
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx, false);
      ctx.response.body = await subjectService.getHierarchy(user, body);
    },
  });

  const setHierarchy = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        hierarchy: exerciseSchema.hierarchy,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      subjectService.setHierarchy(user, body);
    },
  });

  return new Router({
    prefix: "/subject",
  })
    .get("/list", findAll)
    .post("/create", create)
    .post("/info", findOne)
    .post("/permit", permit)
    .use(
      "/static",
      new Router()
        .get("/:subject/:filename", getStatic)
        .put("/:subject/:filename", putStatic)
        .routes()
    )
    .use(
      "/hierarchy",
      new Router()
        .post("/get", getHierarchy)
        .post("/set", setHierarchy)
        .routes()
    );
}
