// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import { generateSeed, joinThrowable, iterateSection } from "../utils/mod.ts";
import { exerciseSchema, subjectSchema, userSchema } from "../schemas/mod.ts";
import { User } from "../models/mod.ts";
import { ExerciseService, ConfigService } from "../services/mod.ts";
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

export function SubjectController(
  authorize: IAuthorizer,
  config: ConfigService,
  userRepository: UserRepository,
  subjectRepository: SubjectRepository,
  exerciseRepository: ExerciseRepository,
  exerciseService: ExerciseService
) {
  const list = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await authorize(ctx, false);
      const allSubjects = exerciseRepository.listSubjects();
      const selection = await Promise.all(
        allSubjects.map(async (s) =>
          isPermittedToView(await subjectRepository.get(s), user)
        )
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
    handle: async (ctx: RouterContext, { body: { subject, assignees } }) => {
      const user = await authorize(ctx);

      if (!(await user.isTeacher())) {
        throw new httpErrors["Forbidden"]();
      }

      await subjectRepository.add(subject, assignees); //! EVO // TODO: V - all assignees exist?
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
      const subject = await subjectRepository.get(subjectId);

      if (!subject) {
        throw new httpErrors["NotFound"]();
      }
      if (!user.isTeacher() || !(await isPermittedToView(subject, user))) {
        throw new httpErrors["Forbidden"]();
      }

      const rawAssignees = await subject.assignees;
      const assignees =
        rawAssignees === null // TODO: rework
          ? null
          : await Promise.all(
              rawAssignees.map(async (userId) => ({
                userId,
                name: (await userRepository.get(userId))?.name, //FIXME n+1
              }))
            );

      ctx.response.body = { assignees };
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

      if (!(await isAssigneeOf(subject, user))) {
        throw new httpErrors["Forbidden"]();
      }
      await subjectRepository.setAssignees(subject!.id, assignees);
    },
  });

  const problemGetSeed = async (
    ctx: RouterContext,
    seed: number | null,
    user?: User
  ) => {
    if (user) {
      return seed !== null && (await user.isTeacher()) ? { seed } : user;
    }

    const _seed = ctx.cookies.get("seed") ?? `${generateSeed()}`;

    ctx.cookies.set("seed", _seed, { maxAge: config.SEED_AGE });

    return { seed: +_seed };
  };

  const getProblem = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        seed: userSchema.seedOptional,
      },
    },
    status: 200,
    handle: async (
      ctx: RouterContext,
      { body: { subject: subjectId, exerciseId, seed } }
    ) => {
      const user = await authorize(ctx, false);
      const subject = await subjectRepository.get(subjectId);

      if (!(await isPermittedToView(subject, user))) {
        throw new httpErrors["Forbidden"]();
      }

      const parsed = await exerciseService.render(
        { subject: subject!.id, exerciseId },
        await problemGetSeed(ctx, seed, user)
      );
      if (!(await isAssigneeOf(subject, user))) {
        const { correctAnswer: _correctAnswer, ...parsedCensored } = parsed;

        ctx.response.body = parsedCensored;
      } else {
        ctx.response.body = parsed;
      }
    },
  });

  const updateProblem = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        answer: exerciseSchema.answer,
      },
    },
    status: 200,
    handle: async (
      ctx: RouterContext,
      { body: { subject, exerciseId, answer } }
    ) => {
      const user = await authorize(ctx, false); //! A

      if (
        !(await isPermittedToView(await subjectRepository.get(subject), user))
      ) {
        throw new httpErrors["Forbidden"]();
      } //! P

      const { info } = await exerciseService.check(
        { subject, exerciseId },
        answer,
        await problemGetSeed(ctx, null, user)
      ); //! EVO
      ctx.response.body = { info }; // ? done, correctAnswer ?
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
        !(await isPermittedToView(await subjectRepository.get(subject), user))
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

      if (!(await isAssigneeOf(await subjectRepository.get(subject), user))) {
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

      await Deno.writeFile(
        joinThrowable(
          exerciseRepository.getStaticContentPath(subject),
          filename
        ),
        body.files[0].content,
        { mode: 0o2664 }
      ); //! resource-intensive
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

      if (
        (await isAssigneeOf(await subjectRepository.get(subject), user)) &&
        !raw
      ) {
        response.unshift({
          name: "",
          children: exerciseRepository
            .unlisted(subject)
            .get()
            .map((x) => {
              try {
                const { name, type, description } = exerciseRepository.get(
                  subject,
                  x
                );
                return {
                  name: name,
                  children: x,
                  type: type,
                  description: description,
                  done: null,
                };
              } catch {
                return; // ignore not existing exercises
              }
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

      if (!(await isAssigneeOf(await subjectRepository.get(subject), user))) {
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
      "/problem",
      new Router()
        .post("/get", getProblem)
        .post("/update", updateProblem)
        .routes()
    )
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
