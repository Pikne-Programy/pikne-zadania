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

// TODO: review the file and solve TODOs

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

  /** check if the subject `s` exists and the user is an assignee of it */
  private async isAssigneeOf(s: string, user?: IUser) {
    if (user === undefined) return false;
    const subject = this.ss.get(s);
    if (await subject.exists()) return false;
    const assignees = await subject.assignees.get();
    return assignees === null || assignees.includes(user.id) || // public or the assignee
      await user.role.get() === "admin"; // or admin
  }

  /** check if the subject would be visible for the User */
  private async isPermittedToView(s: string, user?: IUser) {
    return !/^_/.test(s) || // if it is public
      await this.isAssigneeOf(s, user); // or the User is assigned to it
  }

  async list(ctx: RouterContext) {
    const user = await this.authorize(ctx, false); //! A
    const allSubjects = await this.ss.list();
    const selection = await Promise.all(
      allSubjects.map((s) => this.isPermittedToView(s, user)),
    );
    const subjects = allSubjects.filter((_, i) => selection[i]); //! P
    ctx.response.body = { subjects };
    ctx.response.status = 200; //! D
  }

  async create(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { subject, assignees } = await followSchema(ctx, {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    }); //! R
    if (!["teacher", "admin"].includes(await user.role.get())) { // TODO: isTeacher
      throw new httpErrors["Unauthorized"]();
    } //! P
    translateErrors(await this.ss.add(subject, assignees)); //! EVO // TODO: V - all assignees exit?
    ctx.response.status = 200; //! D
  }

  async info(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { subject } = await followSchema(ctx, {
      subject: schemas.exercise.subject,
    }); //! R
    if (
      !["teacher", "admin"].includes(await user.role.get()) || // is not teacher // TODO: isTeacher
      !await this.isPermittedToView(subject, user) // or is not permitted
    ) {
      throw new httpErrors["Unauthorized"]();
    } //! P
    if (!this.ss.get(subject).exists()) throw new httpErrors["NotFound"](); //! E
    const raw = await this.ss.get(subject).assignees.get();
    const assignees = raw === null // TODO: rework
      ? null
      : await Promise.all(raw.map(async (u) => ({
        userId: u,
        name: await this.us.get(u).name.get(),
      })));
    ctx.response.body = { assignees };
    ctx.response.status = 200; //! D
  }

  async permit(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { subject, assignees } = await followSchema(ctx, {
      subject: schemas.exercise.subject,
      assignees: schemas.subject.assignees,
    }); //! R
    if (!await this.isAssigneeOf(subject, user)) {
      throw new httpErrors["Unauthorized"]();
    } //! P
    if (!this.ss.get(subject).exists()) throw new httpErrors["NotFound"](); //! E
    // TODO: V
    await this.ss.get(subject).assignees.set(assignees); //! O
    ctx.response.status = 200; //! D
  }

  readonly problem = {
    parent: this,

    async getSeed(ctx: RouterContext, seed: number | null, user?: IUser) {
      if (user !== undefined) {
        return seed !== null &&
            ["teacher", "admin"].includes(await user.role.get()) // TODO: isTeacher
          ? { seed }
          : user;
      }
      const s = ctx.cookies.get("seed") ?? `${generateSeed()}`;
      ctx.cookies.set("seed", s, { maxAge: this.parent.cfg.SEED_AGE });
      return { seed: +s };
    },

    async get(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx, false); //! A
      const { subject, exerciseId, seed } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        seed: schemas.user.seedOptional,
      }); //! R
      if (!await this.parent.isPermittedToView(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      const parsed = translateErrors(
        await this.parent.ex.render(
          { subject, exerciseId },
          await this.getSeed(ctx, seed, user),
        ),
      ); //! EO
      if (!this.parent.isAssigneeOf(subject, user)) {
        const parsedCensored: Omit<typeof parsed, "correctAnswer"> & {
          correctAnswer?: unknown;
        } = parsed;
        delete parsedCensored["correctAnswer"];
        ctx.response.body = parsedCensored;
      } else ctx.response.body = parsed;
      ctx.response.status = 200; //! D
    },

    async update(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx, false); //! A
      const { subject, exerciseId, answer } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        answer: schemas.exercise.answer,
      }); //! R
      if (!await this.parent.isPermittedToView(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      const { info } = translateErrors(
        await this.parent.ex.check(
          { subject, exerciseId },
          answer,
          await this.getSeed(ctx, null, user),
        ),
      ); //! EVO
      ctx.response.body = { info }; // ? done, correctAnswer ?
      ctx.response.status = 200; //! D
    },
  };

  readonly static = {
    parent: this,

    async get(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx, false); //! A
      const { subject, filename } = ctx.params;
      if (!subject || !filename) throw new Error("never"); //! R
      if (!await this.parent.isPermittedToView(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      await send(ctx, filename, {
        root: this.parent.es.getStaticContentPath(subject),
      }); // there's a problem with no permission to element
      //! ED -- TODO: check if it works
    },

    async put(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A
      const { subject, filename } = ctx.params;
      if (!subject || !filename) throw new Error("never"); //! R
      if (!await this.parent.isAssigneeOf(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      let content: Uint8Array;
      try {
        const maxSize = 100 * 2 ** 20; // 100 MiB  // TODO: move to config
        const body = await ctx.request.body({ type: "form-data" }).value.read({
          maxFileSize: maxSize,
          maxSize,
        });
        if (body.files === undefined || body.files.length != 1) throw "";
        if (body.files[0].content === undefined) throw "";
        content = body.files[0].content;
      } catch (_) {
        throw new httpErrors["BadRequest"]();
      } //! R -- resource-intensive
      Deno.writeFile( // TODO: move to the service
        joinThrowable(this.parent.es.getStaticContentPath(subject), filename),
        content,
        { mode: 0o2664 },
      ); //! O
      ctx.response.status = 200; //! D
    },
  };
  readonly hierarchy = {
    parent: this,

    async get(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        raw: vs.boolean({ strictType: true }),
      });

      /*
          TODO: use this logic
    private userProgress(arr: DoneSection[], user: User) {
      if (user && user.role.name === "student") {
        for (const e of arr) {
          if (typeof e.children === "string") {
            e.done = user.role.exercises[e.children] ?? null; //TODO(nircek): subject/id
          } else this.userProgress(e.children, user);
        }
      }
    }
      */
      // TODO
      // TODO: If the raw property equals false, there is the description property and can be the optional done property if the User is authenticated.
      // TODO: If the raw property equals false and the User is authorized, there is a {"name": "", children: [...]} (sub-subject) object with all exercises not listed in the hierarchy.
      ctx.response.body = [
        { name: "", children: [{ name: "Kula 2", children: "kula-2" }] },
        {
          name: "mechanika",
          children: [
            {
              name: "kinematyka",
              children: [
                {
                  name: "Pociągi dwa 2",
                  children: "pociagi-dwa",
                  description:
                    "Z miast \\(A\\) i \\(B\\) odległych o \\(d=300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_a= 50\\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_b=70\\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?",
                  done: 0.34,
                },
              ],
            },
          ],
        },
      ];
      ctx.response.status = 200;
    },

    async set(ctx: RouterContext) {
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        hierarchy: schemas.exercise.hierarchy,
      });
      // TODO
      ctx.response.status = 200;
    },
  };

  readonly exercise = {
    parent: this,

    async list(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A -- the Unauthorized shouldn't see exercises not listed in hierarchy
      const { subject } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
      }); //! R
      if (!await this.parent.isPermittedToView(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      const exercises = translateErrors(this.parent.es.listExercises(subject)); // TODO: check E and if all exercises are listed
      ctx.response.body = { exercises };
      ctx.response.status = 200; //! D
    },

    async add(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A
      const { subject, exerciseId, content } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        content: schemas.exercise.content,
      }); //! R
      if (!await this.parent.isAssigneeOf(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      this.parent.es.add(subject, exerciseId, content); // TODO: EVO; await?
      ctx.response.status = 200; //! D
    },

    async get(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A
      const { subject, exerciseId } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
      }); //! R
      if (!await this.parent.isAssigneeOf(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      const content = ""; // this.parent.es.getContent(subject, exerciseId); // TODO: E
      ctx.response.body = { content };
      ctx.response.status = 200; //! D
    },

    async update(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A
      const { subject, exerciseId, content } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        content: schemas.exercise.content,
      }); //! R
      if (!await this.parent.isAssigneeOf(subject, user)) {
        throw new httpErrors["Unauthorized"]();
      } //! P
      translateErrors(this.parent.es.update(subject, exerciseId, content)); // TODO: EVO; await?
      ctx.response.status = 200; //! D
    },

    async preview(ctx: RouterContext) {
      //! AP missing -- TODO: is it ok???
      const { content, seed } = await followSchema(ctx, {
        content: schemas.exercise.content,
        seed: schemas.user.seedDefault,
      }); //! R
      const ex = translateErrors(this.parent.es.parse(content)); //! VO
      ctx.response.body = {
        ...ex.render(seed),
        correctAnswer: ex.getCorrectAnswer(seed),
      };
      ctx.response.status = 200; //! D
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
