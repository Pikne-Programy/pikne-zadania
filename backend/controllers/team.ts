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

  async list(ctx: RouterContext) {
  }

  async create(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      name: schemas.team.name,
    });
  }

  async info(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      teamId: schemas.team.id,
    });
  }

  async update(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      teamId: schemas.team.id,
      invitation: schemas.team.invitationGenerateOptional,
      assignee: schemas.user.idOptional,
      name: schemas.team.nameOptional
    });
  }

  async delete(ctx: RouterContext) {
    const req = await followSchema(ctx, {
      teamId: schemas.team.id,
    });
  }

  readonly router = new Router()
    .get("/list", (ctx: RouterContext) => this.list(ctx))
    .post("/create", (ctx: RouterContext) => this.create(ctx))
    .post("/info", (ctx: RouterContext) => this.info(ctx))
    .post("/update", (ctx: RouterContext) => this.update(ctx))
    .post("/delete", (ctx: RouterContext) => this.delete(ctx));
}
