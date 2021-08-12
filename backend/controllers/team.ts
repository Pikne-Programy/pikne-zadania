// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/config.ts";
import { schemas } from "../types/mod.ts";
import { followSchema, Router, RouterContext as RC } from "../utils/oak.ts";

export class TeamController {
  constructor(
    private cfg: IConfigService,
  ) {}

  async list(ctx: RC) {
  }

  async create(ctx: RC) {
    const req = await followSchema(ctx, {
      name: schemas.team.name,
    });
  }

  async info(ctx: RC) {
    const req = await followSchema(ctx, {
      teamId: schemas.team.id,
    });
  }

  async update(ctx: RC) {
    const req = await followSchema(ctx, {
      teamId: schemas.team.id,
      invitation: schemas.team.invitationGenerateOptional,
      assignee: schemas.user.idOptional,
      name: schemas.team.nameOptional
    });
  }

  async delete(ctx: RC) {
    const req = await followSchema(ctx, {
      teamId: schemas.team.id,
    });
  }

  readonly router = new Router()
    .get("/list", (ctx: RC) => this.list(ctx))
    .post("/create", (ctx: RC) => this.create(ctx))
    .post("/info", (ctx: RC) => this.info(ctx))
    .post("/update", (ctx: RC) => this.update(ctx))
    .post("/delete", (ctx: RC) => this.delete(ctx));
}
