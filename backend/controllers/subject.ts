// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext, send, vs } from "../deps.ts";
import {
  followSchema,
  generateSeed,
  joinThrowable,
  translateErrors,
} from "../utils/mod.ts";
import {
  CustomDictError,
  isJSONType,
  isSubSection,
  schemas,
  Section,
} from "../types/mod.ts";
import {
  IConfigService,
  IExerciseService,
  IExerciseStore,
  IJWTService,
  ISubjectStore,
  ITeam,
  ITeamStore,
  IUser,
  IUserStore,
} from "../interfaces/mod.ts";
import { Authorizer } from "./mod.ts";

export class SubjectController extends Authorizer {
  constructor(
    protected cfg: IConfigService,
    protected jwt: IJWTService,
    protected us: IUserStore,
    protected ts: ITeamStore,
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
    if (!await subject.exists()) return false;
    if (await user.role.get() === "admin") return true;
    const assignees = await subject.assignees.get();
    if (assignees !== null && assignees.includes(user.id)) return true;
    return await user.role.get() === "teacher" && assignees === null; // TODO: user.isTeacher
  }

  /** check if the subject would be visible for the User */
  private async isPermittedToView(s: string, user?: IUser, eid?: string) {
    if (!/^_/.test(s)) return true; // if exercise is public
    if (await user?.role.get() === "admin") return true;
    if (
      user && eid &&
      await this.sessionContains(this.ts.get(await user.team.get()), s, eid)
    ) {
      return true;
    }
    return await this.isAssigneeOf(s, user);
  }

  private async sessionContains(
    team: ITeam | undefined,
    subject: string,
    eid: string,
    view = false,
  ) {
    if (team) {
      return ((await team.session.exercises.get()).includes(
        this.es.uid(subject, eid),
      ) && (!(await team.session.isFinished()) || view));
    }
    return false;
  }

  // TODO: move to a more proper place
  private async submit2Session(
    user: IUser,
    subject: string,
    eid: string,
    done: number,
  ) {
    if (await user.role.get() !== "student") return;
    const team = this.ts.get(await user.team.get());
    if (await team.session.isFinished()) return;
    if (!(await this.sessionContains(team, subject, eid))) return;
    await team.session.report.set(user.id, this.es.uid(subject, eid), done);
  }

  async list(ctx: RouterContext) {
    const user = await this.authorize(ctx, false); //! A
    const allSubjects = this.es.listSubjects();
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
      throw new httpErrors["Forbidden"]();
    } //! P
    translateErrors(await this.ss.add(subject, assignees)); //! EVO // TODO: V - all assignees exist?
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
      throw new httpErrors["Forbidden"]();
    } //! P
    if (!await this.ss.get(subject).exists()) {
      throw new httpErrors["NotFound"](); //! E
    }
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
      throw new httpErrors["Forbidden"]();
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
        return (seed !== null &&
            ["teacher", "admin"].includes(await user.role.get())) // TODO: isTeacher
          ? { seed }
          : user;
      }
      const s = await ctx.cookies.get("seed") ?? `${generateSeed()}`;
      await ctx.cookies.set("seed", s, { maxAge: this.parent.cfg.SEED_AGE });
      return { seed: +s };
    },

    async render(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx, false); //! A
      const { subject, exerciseId, seed } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        seed: schemas.user.seedOptional,
      }); //! R
      let team: undefined | ITeam;
      if (user !== undefined && await user.role.get() !== "admin") {
        team = this.parent.ts.get(await user.team.get());
      }
      if (
        !await this.parent.isPermittedToView(subject, user) &&
        (team !== undefined &&
          !(await this.parent.sessionContains(team, subject, exerciseId, true)))
      ) {
        throw new httpErrors["Forbidden"]();
      } //! P
      let offset = 0;
      if (
        team !== undefined &&
        await this.parent.sessionContains(team, subject, exerciseId, true)
      ) {
        offset = await team.session.seedOffset.get();
      }
      const parsed = translateErrors(
        await this.parent.ex.render(
          { subject, exerciseId },
          await this.getSeed(ctx, seed, user),
          offset,
        ),
      ); //! EO
      if (!await this.parent.isAssigneeOf(subject, user)) {
        const parsedCensored: Omit<typeof parsed, "correctAnswer"> & {
          correctAnswer?: unknown;
        } = parsed;
        delete parsedCensored["correctAnswer"];
        ctx.response.body = parsedCensored;
      } else ctx.response.body = parsed;
      ctx.response.status = 200; //! D
    },

    async submit(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx, false); //! A
      const { subject, exerciseId, answer } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
        answer: schemas.exercise.answer,
      }); //! R
      if (!isJSONType(answer)) throw new httpErrors["BadRequest"]();
      let team: undefined | ITeam;
      if (user !== undefined && await user.role.get() !== "admin") {
        team = this.parent.ts.get(await user.team.get());
      }
      if (
        !await this.parent.isPermittedToView(subject, user) &&
        (team !== undefined &&
          !(await this.parent.sessionContains(team, subject, exerciseId)))
      ) {
        throw new httpErrors["Forbidden"]();
      } //! P
      let offset = 0;
      if (
        team !== undefined &&
        await this.parent.sessionContains(team, subject, exerciseId)
      ) {
        offset = await team.session.seedOffset.get();
      }
      const { done, info } = translateErrors(
        await this.parent.ex.check(
          { subject, exerciseId },
          answer,
          await this.getSeed(ctx, null, user),
          offset,
        ),
      ); //! EVO
      if (user) {
        await this.parent.submit2Session(user, subject, exerciseId, done);
      }
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
        throw new httpErrors["Forbidden"]();
      } //! P
      await send(ctx, filename, {
        root: this.parent.es.getStaticContentPath(subject),
      }); // there's a problem with no permission to element
      //! ED // TODO: check if it works
    },

    async put(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A
      const { subject, filename } = ctx.params;
      if (!subject || !filename) throw new Error("never"); //! R
      if (!await this.parent.isAssigneeOf(subject, user)) {
        throw new httpErrors["Forbidden"]();
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
      const user = await this.parent.authorize(ctx, false); //! A
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        raw: vs.boolean({ strictType: true }),
      }); //! R
      if (!(await this.parent.ss.list()).includes(req.subject)) {
        throw new httpErrors["NotFound"]();
      } //! E
      const iterateSection = async (section: Section[]) => {
        const sectionArray: unknown[] = [];
        for (const el of section) {
          if (!isSubSection(el)) {
            const exercise = this.parent.es.get(req.subject, el.children);
            if (exercise instanceof Error) continue; // ignore not existing exercises
            sectionArray.push({
              name: exercise.name,
              children: el.children,
              type: req.raw ? undefined : exercise.type,
              description: req.raw ? undefined : exercise.description,
              done: (req.raw || user === undefined)
                ? undefined
                : await user.exercises.get(
                  this.parent.es.uid(req.subject, el.children),
                ) ?? null,
            });
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
        ...(await this.parent.isAssigneeOf(req.subject, user) && !req.raw
          ? [{
            name: "",
            children: this.parent.es.unlisted(req.subject).get().flatMap(
              (x) => {
                const exercise = this.parent.es.get(req.subject, x);
                if (exercise instanceof Error) return []; // ignore not existing exercises
                return {
                  name: exercise.name,
                  children: x,
                  type: exercise.type,
                  description: exercise.description,
                  done: null,
                };
              },
            ),
          }]
          : []),
        ...await iterateSection(this.parent.es.structure(req.subject).get()),
      ];
      ctx.response.status = 200;
      //! D
    },

    async set(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A
      const req = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        hierarchy: schemas.exercise.hierarchy,
      }); //! R
      if (!await this.parent.isAssigneeOf(req.subject, user)) {
        throw new httpErrors["Forbidden"]();
      } //! P
      if (!this.parent.es.listSubjects().includes(req.subject)) {
        throw new httpErrors["NotFound"]();
      } //! E
      this.parent.es.structure(req.subject).set(req.hierarchy); //! O // TODO V what i exercise doesn't exist
      ctx.response.status = 200;
      //! D
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
        throw new httpErrors["Forbidden"]();
      } //! P
      const exercises = translateErrors(this.parent.es.listExercises(subject)) //! E // TODO: check if all exercises are listed after refactor
        .map((id) => {
          const ex = this.parent.es.get(subject, id);
          if (ex instanceof CustomDictError) throw new Error("never");
          return {
            id,
            type: ex.type,
            name: ex.name,
            description: ex.description,
          };
        });
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
        throw new httpErrors["Forbidden"]();
      } //! P
      translateErrors(this.parent.es.add(subject, exerciseId, content)); //! EVO
      ctx.response.status = 200; //! D
    },

    async get(ctx: RouterContext) {
      const user = await this.parent.authorize(ctx); //! A
      const { subject, exerciseId } = await followSchema(ctx, {
        subject: schemas.exercise.subject,
        exerciseId: schemas.exercise.id,
      }); //! R
      if (!await this.parent.isAssigneeOf(subject, user)) {
        throw new httpErrors["Forbidden"]();
      } //! P
      const content = this.parent.es.getContent(subject, exerciseId);
      if (content instanceof CustomDictError) {
        throw new httpErrors["NotFound"]();
      } //! E
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
        throw new httpErrors["Forbidden"]();
      } //! P
      translateErrors(this.parent.es.update(subject, exerciseId, content)); //! EVO
      ctx.response.status = 200; //! D
    },

    async preview(ctx: RouterContext) {
      //! AP missing // TODO: is it ok???
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
        .post("/render", (ctx: RouterContext) => this.problem.render(ctx))
        .post("/submit", (ctx: RouterContext) => this.problem.submit(ctx))
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
