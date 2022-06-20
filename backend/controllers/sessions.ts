// Copyright 2022 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { followSchema, generateSeed } from "../utils/mod.ts";
import { CustomDictError, schemas } from "../types/mod.ts";
import {
  IExerciseService,
  IExerciseStore,
  IJWTService,
  ISubjectStore,
  ITeamStore,
  IUser,
  IUserStore,
} from "../interfaces/mod.ts";
import { Authorizer } from "./mod.ts";

export class SessionController extends Authorizer {
  constructor(
    protected jwt: IJWTService,
    protected us: IUserStore,
    protected ts: ITeamStore,
    protected es: IExerciseStore,
    protected ex: IExerciseService,
    protected ss: ISubjectStore,
  ) {
    super(jwt, us);
  }

  // TODO: move to a more proper place
  private async isAssigneeOf(s: string, user?: IUser) {
    if (user === undefined) return false;
    const subject = this.ss.get(s);
    if (!await subject.exists()) throw new httpErrors["NotFound"]();
    if (await user.role.get() === "admin") return true;
    if ((!/^_/.test(s)) && await user.role.get() === "teacher") return true;
    const assignees = await subject.assignees.get();
    if (assignees !== null && assignees.includes(user.id)) return true;
    return await user.role.get() === "teacher" && assignees === null; // TODO: user.isTeacher
  }

  // TODO: move to a more proper place
  private async isAssignee(teamId: number, userId: string) {
    return await this.us.get(userId).role.get() === "admin" ||
      await this.ts.get(teamId).assignee.get() === userId;
  }

  private unicodify(x: number | null) {
    switch (x) {
      case null:
        return "☐";
      case 0:
        return "☒";
      case 1:
        return "☑";
      default:
        return "⚀";
    }
  }

  async reset(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId } = await followSchema(ctx, {
      teamId: schemas.team.id,
    }); //! R
    if (!await this.isAssignee(teamId, user.id)) {
      throw new httpErrors["Forbidden"]();
    } //! P
    const team = this.ts.get(teamId);
    if (!await team.exists()) {
      throw new httpErrors["NotFound"](); //! EV
    }
    await team.session.drop(); //! O
    await team.session.seedOffset.set(generateSeed());
    ctx.response.status = 200; //! D
  }

  async add(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId, subject, exerciseId } = await followSchema(ctx, {
      teamId: schemas.team.id,
      subject: schemas.exercise.subject,
      exerciseId: schemas.exercise.id,
    }); //! R
    if (
      !await this.isAssigneeOf(subject, user) ||
      !await this.isAssignee(teamId, user.id)
    ) {
      throw new httpErrors["Forbidden"]();
    } //! P
    const team = this.ts.get(teamId);
    if (!await team.exists()) {
      throw new httpErrors["NotFound"]();
    }
    if (
      await team.session.isFinished() ||
      (await team.session.exercises.get()).includes(
        this.es.uid(subject, exerciseId),
      )
    ) {
      throw new httpErrors["Conflict"]();
    }
    const exercise = this.es.get(subject, exerciseId);
    if (exercise instanceof CustomDictError) {
      throw new httpErrors["NotFound"](); //! EV
    }
    await team.session.exercises.add(this.es.uid(subject, exerciseId)); //! O
    ctx.response.status = 200; //! D
  }

  async delete(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId, subject, exerciseId } = await followSchema(ctx, {
      teamId: schemas.team.id,
      subject: schemas.exercise.subject,
      exerciseId: schemas.exercise.id,
    }); //! R
    if (!await this.isAssignee(teamId, user.id)) {
      throw new httpErrors["Forbidden"]();
    } //! P
    const team = this.ts.get(teamId);
    if (!await team.exists()) {
      throw new httpErrors["NotFound"]();
    }
    const exercise = this.es.get(subject, exerciseId);
    if (exercise instanceof CustomDictError) {
      throw new httpErrors["NotFound"](); //! EV
    }
    await team.session.exercises.remove(this.es.uid(subject, exerciseId)); //! O
    ctx.response.status = 200; //! D
  }

  async list(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    if (["teacher"].includes(await user.role.get())) {
      throw new httpErrors["Forbidden"]();
    } //! P
    const team = this.ts.get(await user.team.get());
    if (!await team.exists()) {
      throw new httpErrors["NotFound"](); //! EV
    }
    if (!(await team.session.users.get()).includes(user.id)) {
      await team.session.users.add(user.id);
    }

    ctx.response.body = await Promise.all(
      (await team.session.exercises.get()).map(async (e) => {
        const ex = await this.ex.render(
          this.es.deuid(e)!,
          user,
          await team.session.seedOffset.get(),
        ); // teacher is not allowed
        const report = await team.session.report.get();
        if (ex instanceof CustomDictError) return null;
        return {
          subject: this.es.deuid(e)!.subject,
          exerciseId: this.es.deuid(e)!.exerciseId,
          ...ex,
          done: report[user.id][e] ?? null,
        };
      }),
    ); //! O
    ctx.response.status = 200; //! D
  }

  async status(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId } = await followSchema(ctx, {
      teamId: schemas.team.id,
    }); //! R
    if (!await this.isAssignee(teamId, user.id)) {
      throw new httpErrors["Forbidden"]();
    } //! P
    const team = this.ts.get(teamId);
    if (!await team.exists()) {
      throw new httpErrors["NotFound"](); //! EV
    }
    const report = await team.session.report.get();
    const exercises = await team.session.exercises.get();
    ctx.response.body = {
      finished: await team.session.isFinished(),
      exercises: (await team.session.exercises.get()).map((e) => (
        this.es.deuid(e)
      )),
      report: Object.entries(report).map(([userId, correctness]) => ({
        userId,
        exercises: exercises.map((e) => this.unicodify(correctness[e] ?? null)),
      })),
    }; //! OD
    ctx.response.status = 200;
  }

  async end(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId } = await followSchema(ctx, {
      teamId: schemas.team.id,
    }); //! R
    if (!await this.isAssignee(teamId, user.id)) {
      throw new httpErrors["Forbidden"]();
    } //! P
    const team = this.ts.get(teamId);
    if (!await team.exists()) {
      throw new httpErrors["NotFound"](); //! EV
    }
    await team.session.end(); //! O
    ctx.response.status = 200; //! D
  }

  readonly router = new Router()
    .post("/reset", (ctx: RouterContext) => this.reset(ctx))
    .post("/add", (ctx: RouterContext) => this.add(ctx))
    .post("/delete", (ctx: RouterContext) => this.delete(ctx))
    .post("/list", (ctx: RouterContext) => this.list(ctx))
    .post("/status", (ctx: RouterContext) => this.status(ctx))
    .post("/end", (ctx: RouterContext) => this.end(ctx));
}
