// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import { joinThrowable, iterateSection } from "../utils/mod.ts";
import { exerciseSchema, subjectSchema } from "../schemas/mod.ts";
import {
  UserRepository,
  SubjectRepository,
  ExerciseRepository,
} from "../repositories/mod.ts";
import {
  IAuthorizer,
  controller,
  isAssigneeOf,
  isPermittedToView,
} from "../core/mod.ts";
import { CustomDictError } from "../common/mod.ts";

export function SubjectController(
  authorize: IAuthorizer,
  userRepository: UserRepository,
  subjectRepository: SubjectRepository,
  exerciseRepository: ExerciseRepository
) {
  const list = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await authorize(ctx, false);
      const allSubjects = exerciseRepository.listSubjects();
      const selection = await Promise.all(
        allSubjects.map(async (subjectId) => {
          //FIXME n+1
          const subject = await subjectRepository.get(subjectId);
          return subject && isPermittedToView(subject, user);
        })
      );
      const subjects = allSubjects.filter((_, i) => selection[i]);

      ctx.response.body = { subjects };
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
    handle: async (
      ctx: RouterContext,
      { body: { subject: id, assignees } }
    ) => {
      const user = await authorize(ctx);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      }
      // TODO: all assignees exist?
      const subject = await subjectRepository.get(id);

      if (subject) {
        throw new CustomDictError("SubjectAlreadyExists", { subject: id });
      }

      await subjectRepository.collection.insertOne({ id, assignees });
    },
  });

  const info = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { subject: subjectId } }) => {
      const user = await authorize(ctx);
      const subject = await subjectRepository.getOrFail(subjectId);

      if (!user.isTeacher() || !isPermittedToView(subject, user)) {
        throw new httpErrors["Forbidden"]();
      }

      const assignees = await Promise.all(
        (subject.assignees || []).map(async (userId) => ({
          userId,
          name: (await userRepository.get(userId))?.name, //FIXME n+1
        }))
      );

      ctx.response.body = {
        // learn more: https://pikne-programy.github.io/pikne-zadania/API#:~:text=POST%20/api/subject/create%20%2D%20create%20a%20new%20subject
        assignees: assignees.length ? assignees : null,
      };
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
    handle: async (
      ctx: RouterContext,
      { body: { subject: subjectId, assignees } }
    ) => {
      const user = await authorize(ctx);
      const subject = await subjectRepository.get(subjectId);

      if (!isAssigneeOf(subject, user)) {
        throw new httpErrors["Forbidden"]();
      }
      await subjectRepository.collection.updateOne(
        { id: subject!.id },
        {
          $set: { assignees },
        }
      );
    },
  });

  const getStatic = controller({
    schema: {
      params: {
        subject: vs.string({ strictType: true }),
        filename: vs.string({ strictType: true }),
      },
    },
    handle: async (ctx: RouterContext, { params: { subject, filename } }) => {
      const user = await authorize(ctx, false);

      if (
        !isPermittedToView(await subjectRepository.getOrFail(subject), user)
      ) {
        throw new httpErrors["Forbidden"]();
      }

      await send(ctx, filename, {
        root: exerciseRepository.getStaticContentPath(subject),
      }); // there's a problem with no permission to element
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
    handle: async (ctx: RouterContext, { params: { subject, filename } }) => {
      const user = await authorize(ctx);

      if (!isAssigneeOf(await subjectRepository.get(subject), user)) {
        throw new httpErrors["Forbidden"]();
      }

      const maxSize = 100 * 2 ** 20; // 100 MiB  // TODO: move to config
      const body = await ctx.request.body({ type: "form-data" }).value.read({
        maxFileSize: maxSize,
        maxSize,
      });

      if (!(body.files?.length == 1 && body.files[0].content)) {
        throw new httpErrors["BadRequest"]();
      }

      //! resource-intensive
      await Deno.writeFile(
        joinThrowable(
          exerciseRepository.getStaticContentPath(subject),
          filename
        ),
        body.files[0].content,
        { mode: 0o2664 }
      );
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
    handle: async (ctx: RouterContext, { body: { subject, raw } }) => {
      const user = await authorize(ctx, false);

      if (!exerciseRepository.listSubjects().includes(subject)) {
        throw new httpErrors["NotFound"]();
      }

      const response = await iterateSection(
        exerciseRepository._structure[subject],
        subject,
        raw,
        exerciseRepository,
        user
      );

      if (isAssigneeOf(await subjectRepository.get(subject), user) && !raw) {
        response.unshift({
          name: "",
          children: exerciseRepository.unlisted[subject]
            .map((children) => {
              const exercise = exerciseRepository.get(subject, children);

              return (
                exercise && {
                  name: exercise.name,
                  children,
                  type: exercise.type,
                  description: exercise.description,
                  done: null,
                }
              );
            })
            .filter(Boolean),
        });
      }
      ctx.response.body = response;
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
    handle: async (ctx: RouterContext, { body: { subject, hierarchy } }) => {
      const user = await authorize(ctx);

      if (!isAssigneeOf(await subjectRepository.get(subject), user)) {
        throw new httpErrors["Forbidden"]();
      }

      if (!exerciseRepository.listSubjects().includes(subject)) {
        throw new httpErrors["NotFound"]();
      }
      // TODO V what if exercise doesn't exist
      exerciseRepository.structureSet(subject, hierarchy);
    },
  });

  return new Router({
    prefix: "/subject",
  })
    .get("/list", list)
    .post("/create", create)
    .post("/info", info)
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
