// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { teamSchema, userSchema } from "../schemas/mod.ts";
import { TeamService } from "../services/mod.ts";
import { TokenAuthController } from "./auth/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class TeamController {
  constructor(
    private controller: TokenAuthController,
    private teamService: TeamService,
  ) {}
  findAll() {
    return this.controller.route({
      status: 200,
      auth: true,
      handle: async (ctx: RouterContext, { user }) => {
        ctx.response.body = await this.teamService.findAll(user);
      },
    });
  }

  create() {
    return this.controller.route({
      schema: {
        body: {
          name: teamSchema.name,
        },
      },
      auth: true,
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        ctx.response.body = await this.teamService.create(user, body);
      },
    });
  }

  findOne() {
    return this.controller.route({
      schema: {
        body: {
          teamId: teamSchema.id,
        },
      },
      auth: true,
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        ctx.response.body = await this.teamService.findOne(user, body);
      },
    });
  }

  update() {
    return this.controller.route({
      schema: {
        body: {
          teamId: teamSchema.id,
          invitation: teamSchema.invitationGenerateOptional,
          assignee: userSchema.idOptional,
          name: teamSchema.nameOptional,
        },
      },
      auth: true,
      status: 200,
      handle: async (_: RouterContext, { body, user }) => {
        await this.teamService.update(user, body);
      },
    });
  }

  remove() {
    return this.controller.route({
      schema: {
        body: {
          teamId: teamSchema.id,
        },
      },
      auth: true,
      status: 200,
      handle: async (_: RouterContext, { body, user }) => {
        await this.teamService.delete(user, body);
      },
    });
  }

  router = () =>
    new Router({
      prefix: "/team",
    })
      .get("/list", this.findAll)
      .post("/create", this.create)
      .post("/info", this.findOne)
      .post("/update", this.update)
      .post("/delete", this.remove);
}
