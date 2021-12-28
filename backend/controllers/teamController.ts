// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";
import { teamSchema, userSchema } from "../schemas/mod.ts";
import { TeamService } from "../services/mod.ts";
import { controller, IAuthorizer } from "../core/mod.ts";

export function TeamController(
  authorize: IAuthorizer,
  teamService: TeamService
) {
  const findAll = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await authorize(ctx);
      ctx.response.body = await teamService.findAll(user);
    },
  });

  const create = controller({
    schema: {
      body: {
        name: teamSchema.name,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      ctx.response.body = await teamService.create(user, body);
    },
  });

  const findOne = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      ctx.response.body = await teamService.findOne(user, body);
    },
  });

  const update = controller({
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
      const user = await authorize(ctx);
      await teamService.update(user, body);
    },
  });

  const remove = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      await teamService.delete(user, body);
    },
  });

  return new Router({
    prefix: "/team",
  })
    .get("/list", findAll)
    .post("/create", create)
    .post("/info", findOne)
    .post("/update", update)
    .post("/delete", remove);
}
