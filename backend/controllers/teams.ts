// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors } from "../deps.ts";
import { teamSchema } from "../types/mod.ts";
import { followSchema, RouterContext } from "../utils/mod.ts";
import { ITeams } from "../interfaces/mod.ts";

// TODO: permissions
export class TeamsController {
  constructor(
    private teams: ITeams,
  ) {}

  getAll(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = this.teams.getAllOf(ctx.state.user!); // auth required
  }

  readonly add = followSchema(
    { name: teamSchema.nameReq },
    async (ctx, req) => {
      const teamid = await this.teams.add(req.name, ctx.state.user!); // auth required
      if (!teamid) throw new httpErrors["Forbidden"]();
      ctx.response.status = 201;
      ctx.response.body = teamid;
    },
  );

  readonly delete = followSchema(
    { id: teamSchema.id },
    async (ctx, req) => {
      if (!await this.teams.delete(req.id)) {
        throw new httpErrors["NotFound"]();
      }
      ctx.response.status = 200;
    },
  );

  readonly get = followSchema({ id: teamSchema.id }, async (ctx, req) => {
    const team = await this.teams.get(req.id);
    if (!team) throw new httpErrors["NotFound"]();
    ctx.response.status = 200;
    ctx.response.body = team;
  });

  readonly update = followSchema({
    id: teamSchema.id,
    invitation: teamSchema.invitation,
    assignee: teamSchema.assignee,
    name: teamSchema.name,
  }, async (ctx, req) => {
    switch (
      await this.teams.update(
        req.id,
        req.invitation ?? undefined,
        req.assignee ?? undefined,
        req.name ?? undefined,
      )
    ) {
      case 1:
        throw new httpErrors["NotFound"]();
      case 2:
        throw new httpErrors["Conflict"]();
    }
    ctx.response.status = 200;
  });
}
