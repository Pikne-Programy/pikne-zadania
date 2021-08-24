// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { followSchema, translateErrors } from "../utils/mod.ts";
import { schemas } from "../types/mod.ts";
import {
  IJWTService,
  ITeamStore,
  IUser,
  IUserStore,
} from "../interfaces/mod.ts";
import { Authorizer } from "./mod.ts";

export class UserController extends Authorizer {
  constructor(
    protected jwt: IJWTService,
    protected us: IUserStore,
    protected ts: ITeamStore,
  ) {
    super(jwt, us);
  }

  private async isAssigneeOf(assignee: IUser, who: IUser) {
    return await who.exists() &&
        assignee.id ===
          await this.ts.get(await who.team.get()).assignee.get() ||
      await assignee.role.get() === "admin";
  }

  async info(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    let { userId } = await followSchema(ctx, {
      userId: schemas.user.idOptional,
    });
    if (userId === null) userId = user.id; //! R
    const who = this.us.get(userId);
    if (
      userId !== user.id && // not themself and
      !this.isAssigneeOf(user, who) // member of not their team // TODO: change when dealing with groups (but to what?)
    ) {
      throw new httpErrors["Forbidden"]();
    } //! P
    if (!await who.exists()) throw new httpErrors["NotFound"](); //! E
    ctx.response.body = {
      name: await who.name.get(),
      teamId: await who.team.get(),
      number: await who.number.get(),
    };
    ctx.response.status = 200; //! D
  }

  async update(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { userId, number, name } = await followSchema(ctx, {
      userId: schemas.user.id,
      number: schemas.user.numberOptional,
      name: schemas.user.nameOptional,
    }); //! R
    const who = this.us.get(userId);
    if (
      // ? themself ?
      !this.isAssigneeOf(user, who) // member of not their team // TODO: change when dealing with groups (but to what? maybe add two Ps?)
    ) {
      throw new httpErrors["Forbidden"]();
    } //! P
    if (await who.exists()) throw new httpErrors["NotFound"](); //! E
    if (number !== null) {
      await who.number.set(isNaN(number) ? undefined : number);
    }
    //! V already in schemas
    if (name !== null) await who.name.set(name); //! O
    ctx.response.status = 200; //! D
  }

  async delete(ctx: RouterContext) {
    const user = await this.authorize(ctx); //! A
    const { userId } = await followSchema(ctx, {
      userId: schemas.user.id,
    }); //! R
    const who = this.us.get(userId);
    if (
      // ? themself ?
      !this.isAssigneeOf(user, who) // member of not their team // TODO: change when dealing with groups (but to what? maybe add two Ps?)
    ) {
      throw new httpErrors["Forbidden"]();
    } //! P
    translateErrors(await this.us.delete(userId)); //! EO
    ctx.response.status = 200; //! D
  }

  readonly router = new Router()
    .post("/info", (ctx: RouterContext) => this.info(ctx))
    .post("/update", (ctx: RouterContext) => this.update(ctx))
    .post("/delete", (ctx: RouterContext) => this.delete(ctx));
}
