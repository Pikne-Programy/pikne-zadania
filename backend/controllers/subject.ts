// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import { generateSeed, joinThrowable } from "../utils/mod.ts";
import { isSubSection, schemas, Section } from "../types/mod.ts";
import { User } from "../models/mod.ts";
import { ExerciseService, ConfigService } from "../services/mod.ts";
import {
  UserRepository,
  SubjectRepository,
  ExerciseRepository,
} from "../repositories/mod.ts";
import { IAuthorizer } from "./mod.ts";
import { ValidatorMiddleware } from "../middlewares/mod.ts";

export function SubjectController(
  authorize: IAuthorizer,
  config: ConfigService,
  userRepository: UserRepository,
  subjectRepository: SubjectRepository,
  exerciseRepository: ExerciseRepository,
  exerciseService: ExerciseService
) {
  /** check if the subject `s` exists and the user is an assignee of it */
  async function isAssigneeOf(s: string, user?: User) {
    if (user === undefined) {
      return false;
    }
    const subject = subjectRepository.get(s);

    if (!(await subject.exists())) {
      return false;
    }
    if ((await user.role.get()) === "admin") {
      return true;
    }
    const assignees = await subject.assignees.get();

    if (assignees !== null && assignees.includes(user.id)) {
      return true;
    }
    return (await user.role.get()) === "teacher" && assignees === null; // TODO: user.isTeacher
  }

  /** check if the subject would be visible for the User */
  async function isPermittedToView(s: string, user?: User) {
    return !/^_/.test(s) || (await user?.role.get()) === "admin"
      ? true
      : isAssigneeOf(s, user);
  }

  async function list(ctx: RouterContext) {
    const user = await authorize(ctx, false); //! A
    const allSubjects = exerciseRepository.listSubjects();
    const selection = await Promise.all(
      allSubjects.map((s) => isPermittedToView(s, user))
    );
    const subjects = allSubjects.filter((_, i) => selection[i]); //! P

    ctx.response.body = { subjects };
    ctx.response.status = 200; //! D
  }

  const create = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    },
    async (ctx: RouterContext, { subject, assignees }) => {
      const user = await authorize(ctx); //! A

      if (!["teacher", "admin"].includes(await user.role.get())) {
        // TODO: isTeacher
        throw new httpErrors["Forbidden"]();
      } //! P

      await subjectRepository.add(subject, assignees); //! EVO // TODO: V - all assignees exist?

      ctx.response.status = 200; //! D
    }
  );

  const info = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
    },
    async (ctx: RouterContext, { subject }) => {
      const user = await authorize(ctx); //! A

      if (
        !["teacher", "admin"].includes(await user.role.get()) || // is not teacher // TODO: isTeacher
        !(await isPermittedToView(subject, user)) // or is not permitted
      ) {
        throw new httpErrors["Forbidden"]();
      } //! P

      if (!(await subjectRepository.get(subject).exists())) {
        throw new httpErrors["NotFound"](); //! E
      }

      const rawAssignees = await subjectRepository.get(subject).assignees.get();
      const assignees =
        rawAssignees === null // TODO: rework
          ? null
          : await Promise.all(
              rawAssignees.map(async (userId) => ({
                userId,
                name: await userRepository.get(userId).name.get(),
              }))
            );

      ctx.response.body = { assignees };
      ctx.response.status = 200; //! D
    }
  );

  const permit = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    },
    async (ctx: RouterContext, { subject, assignees }) => {
      const user = await authorize(ctx); //! A

      if (!(await isAssigneeOf(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      if (!subjectRepository.get(subject).exists()) {
        throw new httpErrors["NotFound"]();
      } //! E
      // TODO: V

      await subjectRepository.get(subject).assignees.set(assignees); //! O

      ctx.response.status = 200; //! D
    }
  );

  const problemGetSeed = async (
    ctx: RouterContext,
    seed: number | null,
    user?: User
  ) => {
    if (user !== undefined) {
      return seed !== null &&
        ["teacher", "admin"].includes(await user.role.get()) // TODO: isTeacher
        ? { seed }
        : user;
    }

    const _seed = ctx.cookies.get("seed") ?? `${generateSeed()}`;

    ctx.cookies.set("seed", _seed, { maxAge: config.SEED_AGE });

    return { seed: +_seed };
  };

  const getProblem = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      exerciseId: schemas.exercise.id,
      seed: schemas.user.seedOptional,
    },
    async (ctx: RouterContext, { subject, exerciseId, seed }) => {
      const user = await authorize(ctx, false); //! A

      if (!(await isPermittedToView(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      const parsed = await exerciseService.render(
        { subject, exerciseId },
        await problemGetSeed(ctx, seed, user)
      ); //! EO
      if (!isAssigneeOf(subject, user)) {
        const { correctAnswer: _correctAnswer, ...parsedCensored } = parsed;

        ctx.response.body = parsedCensored;
      } else {
        ctx.response.body = parsed;
      }
      ctx.response.status = 200; //! D
    }
  );

  const updateProblem = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      exerciseId: schemas.exercise.id,
      answer: schemas.exercise.answer,
    },
    async (ctx: RouterContext, { subject, exerciseId, answer }) => {
      const user = await authorize(ctx, false); //! A

      if (!(await isPermittedToView(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      const { info } = await exerciseService.check(
        { subject, exerciseId },
        answer,
        await problemGetSeed(ctx, null, user)
      ); //! EVO
      ctx.response.body = { info }; // ? done, correctAnswer ?
      ctx.response.status = 200; //! D
    }
  );

  const getStatic = async (ctx: RouterContext) => {
    const user = await authorize(ctx, false); //! A
    const { subject, filename } = ctx.params;

    if (!subject || !filename) {
      throw new Error("never");
    } //! R
    if (!(await isPermittedToView(subject, user))) {
      throw new httpErrors["Forbidden"]();
    } //! P

    await send(ctx, filename, {
      root: exerciseRepository.getStaticContentPath(subject),
    }); // there's a problem with no permission to element
    //! ED // TODO: check if it works
  };

  const putStatic = async (ctx: RouterContext) => {
    const user = await authorize(ctx); //! A
    const { subject, filename } = ctx.params;

    if (!subject || !filename) {
      throw new Error("never");
    } //! R
    if (!(await isAssigneeOf(subject, user))) {
      throw new httpErrors["Forbidden"]();
    } //! P

    try {
      const maxSize = 100 * 2 ** 20; // 100 MiB  // TODO: move to config
      const body = await ctx.request.body({ type: "form-data" }).value.read({
        maxFileSize: maxSize,
        maxSize,
      });

      if (
        body.files === undefined ||
        body.files.length != 1 ||
        body.files[0].content === undefined
      ) {
        throw "";
      }

      const { content } = body.files[0];

      Deno.writeFile(
        // TODO: move to the service
        joinThrowable(
          exerciseRepository.getStaticContentPath(subject),
          filename
        ),
        content,
        { mode: 0o2664 }
      ); //! O

      ctx.response.status = 200; //! D
    } catch {
      throw new httpErrors["BadRequest"]();
    } //! R -- resource-intensive
  };

  const getHierarchy = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      raw: vs.boolean({ strictType: true }),
    },
    async (ctx: RouterContext, req) => {
      const user = await authorize(ctx, false); //! A

      if (!exerciseRepository.listSubjects().includes(req.subject)) {
        throw new httpErrors["NotFound"]();
      } //! E

      const iterateSection = async (section: Section[]) => {
        const sectionArray: unknown[] = [];

        for (const el of section) {
          if (!isSubSection(el)) {
            try {
              const exercise = exerciseRepository.get(req.subject, el.children);
              sectionArray.push({
                name: exercise.name,
                children: el.children,
                type: req.raw ? undefined : exercise.type,
                description: req.raw ? undefined : exercise.description,
                done:
                  req.raw || user === undefined
                    ? undefined
                    : (await user.exercises.get(
                        exerciseRepository.uid(req.subject, el.children)
                      )) ?? null,
              });
            } catch {
              // we really need this comment
            }
          } else {
            sectionArray.push({
              name: el.name,
              children: await iterateSection(el.children),
            });
          }
        }

        return sectionArray;
      };

      ctx.response.body = [
        (await isAssigneeOf(req.subject, user)) &&
          !req.raw && [
            {
              name: "",
              children: exerciseRepository
                .unlisted(req.subject)
                .get()
                .flatMap((x) => {
                  try {
                    const exercise = exerciseRepository.get(req.subject, x);
                    return {
                      name: exercise.name,
                      children: x,
                      type: exercise.type,
                      description: exercise.description,
                      done: null,
                    };
                  } catch {
                    return []; // ignore not existing exercises
                  }
                }),
            },
          ],
        ...(await iterateSection(
          exerciseRepository.structure(req.subject).get()
        )),
      ].filter(Boolean);

      ctx.response.status = 200;
      //! D
    }
  );

  const setHierarchy = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      hierarchy: schemas.exercise.hierarchy,
    },
    async (ctx: RouterContext, { subject, hierarchy }) => {
      const user = await authorize(ctx); //! A

      if (!(await isAssigneeOf(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      if (!exerciseRepository.listSubjects().includes(subject)) {
        throw new httpErrors["NotFound"]();
      } //! E

      exerciseRepository.structure(subject).set(hierarchy); //! O // TODO V what i exercise doesn't exist
      ctx.response.status = 200;
      //! D
    }
  );

  const listExercise = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
    },
    async (ctx: RouterContext, { subject }) => {
      const user = await authorize(ctx); //! A -- the Unauthorized shouldn't see exercises not listed in hierarchy

      if (!(await isPermittedToView(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      const exercises = exerciseRepository
        .listExercises(subject)
        //! E // TODO: check if all exercises are listed after refactor
        .map((id) => {
          const exercise = exerciseRepository.get(subject, id);

          return {
            id,
            type: exercise.type,
            name: exercise.name,
            description: exercise.description,
          };
        });

      ctx.response.body = { exercises };
      ctx.response.status = 200; //! D
    }
  );
  const addExercise = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      exerciseId: schemas.exercise.id,
      content: schemas.exercise.content,
    },
    async (ctx: RouterContext, { subject, exerciseId, content }) => {
      const user = await authorize(ctx); //! A

      if (!(await isAssigneeOf(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      exerciseRepository.add(subject, exerciseId, content); //! EVO

      ctx.response.status = 200; //! D
    }
  );

  const getExercise = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      exerciseId: schemas.exercise.id,
    },
    async (ctx: RouterContext, { subject, exerciseId }) => {
      const user = await authorize(ctx); //! A

      if (!(await isAssigneeOf(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      const content = exerciseRepository.getContent(subject, exerciseId);

      ctx.response.body = { content };
      ctx.response.status = 200; //! D
    }
  );

  const updateExercise = ValidatorMiddleware(
    {
      subject: schemas.exercise.subject,
      exerciseId: schemas.exercise.id,
      content: schemas.exercise.content,
    },
    async (ctx: RouterContext, { subject, exerciseId, content }) => {
      const user = await authorize(ctx); //! A

      if (!(await isAssigneeOf(subject, user))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      exerciseRepository.update(subject, exerciseId, content); //! EVO

      ctx.response.status = 200; //! D
    }
  );

  const previewExercise = ValidatorMiddleware(
    {
      content: schemas.exercise.content,
      seed: schemas.user.seedDefault,
    },
    (ctx: RouterContext, { content, seed }) => {
      //! AP missing // TODO: is it ok???
      const exercise = exerciseRepository.parse(content); //! VO

      ctx.response.body = {
        ...exercise.render(seed),
        correctAnswer: exercise.getCorrectAnswer(seed),
      };
      ctx.response.status = 200; //! D
    }
  );

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
    )
    .use(
      "/exercise",
      new Router()
        .post("/list", listExercise)
        .post("/add", addExercise)
        .post("/get", getExercise)
        .post("/update", updateExercise)
        .post("/preview", previewExercise)
        .routes()
    );
}
