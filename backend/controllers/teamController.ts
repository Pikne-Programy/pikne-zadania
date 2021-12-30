// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { teamSchema, userSchema } from "../schemas/mod.ts";
import { TeamService } from "../services/mod.ts";
import { controller } from "../core/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";
import { Authorizer } from "./mod.ts";

@Injectable()
export class TeamController {
  constructor(
    private authorizer: Authorizer,
    private teamService: TeamService
  ) {}
  findAll = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await this.authorizer.auth(ctx);
      ctx.response.body = await this.teamService.findAll(user);
    },
  });

  create = controller({
    schema: {
      body: {
        name: teamSchema.name,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      ctx.response.body = await this.teamService.create(user, body);
    },
  });

  findOne = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      ctx.response.body = await this.teamService.findOne(user, body);
    },
  });

  update = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
        invitation: teamSchema.invitationGenerateOptional,
        assignee: userSchema.idOptional,
        name: teamSchema.nameOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      await this.teamService.update(user, body);
    },
  });

  remove = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      await this.teamService.delete(user, body);
    },
  });

  router = new Router({
    prefix: "/team",
  })
    .get("/list", this.findAll)
    .post("/create", this.create)
    .post("/info", this.findOne)
    .post("/update", this.update)
    .post("/delete", this.remove);
}
