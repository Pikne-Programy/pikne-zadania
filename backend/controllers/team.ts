// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { followSchema, translateErrors } from "../utils/mod.ts";
import { reservedTeamInvitation, schemas } from "../types/mod.ts";
import { IJWTService, ITeamStore, IUserStore } from "../interfaces/mod.ts";
import { Authorizer } from "./mod.ts";

export class TeamController extends Authorizer {
  constructor(
    protected jwt: IJWTService,
    protected us: IUserStore,
    protected ts: ITeamStore,
  ) {
    super(jwt, us);
  }

  protected async isAssignee(teamId: number, userId: string) {
    return await this.us.get(userId).role.get() === "admin" ||
      await this.ts.get(teamId).assignee.get() === userId;
  }

  async list(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    if (!["admin", "teacher"].includes(await user.role.get())) { // TODO: user.isTeacher
      throw new httpErrors["Forbidden"]();
    } //! P -- every and only teacher is able to view all teams !
    ctx.response.body = await Promise.all(
      (await this.ts.list()).map(async (e) => ({
        teamId: e.id,
        name: e.name,
        assignee: {
          userId: e.assignee,
          name: await this.us.get(e.assignee).name.get(),
        },
        invitation: await this.isAssignee(e.id, user.id)
          ? e.invitation ?? null
          : undefined,
      })),
    );
    ctx.response.status = 200; //! D
  }

  async create(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { name } = await followSchema(ctx, {
      name: schemas.team.name,
    }); //! R
    if (!["admin", "teacher"].includes(await user.role.get())) { // TODO: user.isTeacher
      throw new httpErrors["Forbidden"]();
    } //! P
    const teamId = translateErrors(
      await this.ts.add(null, { name, assignee: user.id }), // ? 404 ?
    ); //! EVO
    ctx.response.body = { teamId };
    ctx.response.status = 200; //! D
  }

  async info(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId } = await followSchema(ctx, {
      teamId: schemas.team.id,
    }); //! R
    const role = await user.role.get();
    let verbosity: 0 | 1 | 2;
    if (!["admin", "teacher"].includes(role)) { // TODO: user.isTeacher
      verbosity = 0;
      if (await user.team.get() != teamId) throw new httpErrors["Forbidden"](); //! P
    }
    const team = this.ts.get(teamId);
    if (!await team.exists()) throw new httpErrors["NotFound"](); //! E
    verbosity ??= await this.isAssignee(teamId, user.id) ? 2 : 1;
    const assignee = await team.assignee.get();
    ctx.response.body = {
      name: await team.name.get(),
      assignee: {
        userId: verbosity >= 1 ? assignee : undefined,
        name: await this.us.get(assignee).name.get(),
      },
      invitation: verbosity >= 2
        ? await team.invitation.get() ?? null
        : undefined,
      members: await Promise.all(
        (await team.members.get()).map(this.us.get).map(async (e) => ({
          userId: verbosity >= 1 ? e.id : undefined,
          name: await e.name.get(),
          number: await e.number.get() ?? null,
        })),
      ),
    };
    ctx.response.status = 200; //! D
  }

  async update(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId, invitation, assignee, name } = await followSchema(ctx, {
      teamId: schemas.team.id,
      invitation: schemas.team.invitationGenerateOptional,
      assignee: schemas.user.idOptional,
      name: schemas.team.nameOptional,
    }); //! R
    const team = this.ts.get(teamId);
    if (!["admin", "teacher"].includes(await user.role.get())) { // TODO: user.isTeacher
      throw new httpErrors["Forbidden"]();
    } //! P of list
    if (!await team.exists()) throw new httpErrors["NotFound"](); //! E
    if (!await this.isAssignee(teamId, user.id)) {
      throw new httpErrors["Forbidden"]();
    } //! P of update
    if (assignee !== null) {
      if (!await this.us.get(assignee).exists()) {
        throw new httpErrors["BadRequest"]("`assignee` doesn't exist");
      } //! V
      await team.assignee.set(assignee);
    }
    if (invitation !== null) {
      let inv = invitation === "" ? undefined : invitation;
      if (inv === reservedTeamInvitation) {
        inv = this.ts.invitation.create(teamId);
      }
      // TODO: V
      await team.invitation.set(inv);
    }
    if (name !== null) await team.name.set(name); //! O
    ctx.response.status = 200; //! D
  }

  async delete(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { teamId } = await followSchema(ctx, {
      teamId: schemas.team.id,
    }); //! R
    const team = this.ts.get(teamId);
    if (!["admin", "teacher"].includes(await user.role.get())) { // TODO: user.isTeacher
      throw new httpErrors["Forbidden"]();
    } //! P of list
    if (!await team.exists()) throw new httpErrors["NotFound"](); //! E
    if (!await this.isAssignee(teamId, user.id)) {
      throw new httpErrors["Forbidden"]();
    } //! P of delete
    await this.ts.delete(teamId); // * Error not handled //! O
    ctx.response.status = 200; //! D
  }

  readonly router = new Router()
    .get("/list", (ctx: RouterContext) => this.list(ctx))
    .post("/create", (ctx: RouterContext) => this.create(ctx))
    .post("/info", (ctx: RouterContext) => this.info(ctx))
    .post("/update", (ctx: RouterContext) => this.update(ctx))
    .post("/delete", (ctx: RouterContext) => this.delete(ctx));
}
