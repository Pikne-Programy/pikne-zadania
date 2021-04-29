// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors } from "../deps.ts";
import { db, RouterContext, safeJSONbody, safeJSONType } from "../utils/mod.ts";
import { endpointSchema as endpoint, Team } from "../types/mod.ts";

export async function getAllTeams(ctx: RouterContext) {
  // TODO: check assignee if not root
  const teams: Team[] = await db.getAllTeams();
  if (!teams) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
  ctx.response.body = teams.map((team) => ({
    id: team.id,
    name: team.name,
    assignee: team.assignee,
    open: team.invCode !== null,
  }));
}
export async function addTeam(ctx: RouterContext) {
  const req = await safeJSONbody(ctx, endpoint.addTeam);
  const user = ctx.state.user!; // auth required
  const teamid = await db.addTeam({
    "name": req.name,
    "assignee": user.name,
    "members": [],
    "invCode": null,
  });
  if (!teamid) {
    throw new httpErrors["Forbidden"]();
  }
  ctx.response.status = 201;
  ctx.response.body = teamid;
}
export async function getTeam(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  const team = await db.getTeam(id);
  if (!team) throw new httpErrors["NotFound"]();
  const members: { id: string; name: string; number: number | null }[] = [];
  for (const member of team.members) {
    const user = await db.getUser(member);
    if (user) {
      members.push({
        id: user.id,
        name: user.name,
        number: user.role.name === "student" ? user.role.number : null,
      });
    } else console.warn(`${member} not in team ${id}`);
  }
  ctx.response.status = 200;
  ctx.response.body = {
    "name": team.name,
    "invitation": team.invCode,
    "assignee": team.assignee,
    "members": members,
  };
}
export async function setTeamName(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  const name = await safeJSONType(ctx, "string");
  if (!await db.setTeam({ id, name })) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
}
export async function changeAssignee(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  const userid = await safeJSONType(ctx, "string");
  const user = await db.getUser(userid);
  if (!user) {
    console.error(`changeAssignee: User with id ${userid} doesn't exist`);
    throw new httpErrors["NotFound"]();
  }
  if (!await db.setTeam({ id, assignee: user.name })) {
    throw new httpErrors["NotFound"]();
  }
  ctx.response.status = 200;
}
export async function openRegistration(ctx: RouterContext) {
  // TODO: handle null value
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  const invitation = await safeJSONType(ctx, "string");
  if (!await db.getTeam(id)) throw new httpErrors["NotFound"]();
  if (!await db.setInvitationCode(id, invitation)) {
    throw new httpErrors["Conflict"]();
  }
  ctx.response.status = 200;
}
export async function closeRegistration(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  if (!await db.setInvitationCode(id, null)) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
}
