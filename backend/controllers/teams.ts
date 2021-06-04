// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors } from "../deps.ts";
import { followSchema, RouterContext, Team, User } from "../utils/mod.ts";
import { teamSchema, TeamType } from "../types/mod.ts";

export async function getAllTeams(ctx: RouterContext) {
  // TODO: check assignee if not root
  const teams: TeamType[] = await Team.getAll();
  if (!teams) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
  ctx.response.body = teams.map((team) => ({
    id: team.id,
    name: team.name,
    assignee: team.assignee,
    open: team.invCode !== null,
  }));
}
export const addTeam = followSchema(
  { name: teamSchema.name },
  async (ctx, req) => {
    const user = ctx.state.user!; // auth required
    const teamid = await Team.add({
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
  },
);
export async function getTeam(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  const team = await Team.get(id);
  if (!team) throw new httpErrors["NotFound"]();
  const members: { id: string; name: string; number: number | null }[] = [];
  for (const member of team.members) {
    const user = await User.get(member);
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
  let name;
  try {
    name = await ctx.request.body({ type: "json" }).value;
    if (typeof name !== "string") throw "xd";
  } catch {
    throw new httpErrors["BadRequest"]();
  }
  if (!await Team.set({ id, name })) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
}
export async function changeAssignee(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  let userId;
  try {
    userId = await ctx.request.body({ type: "json" }).value;
    if (typeof userId !== "string") throw "xd";
  } catch {
    throw new httpErrors["BadRequest"]();
  }
  const user = await User.get(userId);
  if (!user) {
    console.error(`changeAssignee: User with id ${userId} doesn't exist`);
    throw new httpErrors["NotFound"]();
  }
  if (!await Team.set({ id, assignee: user.name })) {
    throw new httpErrors["NotFound"]();
  }
  ctx.response.status = 200;
}

function generateInvitationCode(id: number): string {
  const ntob = (n: number): string => {
    const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
      "abcdefghijklmnopqrstuvwxyz0123456789+/";
    return base64[n];
  };
  const randomArray = new Uint8Array(4);
  window.crypto.getRandomValues(randomArray);
  let invCode = ntob(id);
  for (const n of randomArray) {
    invCode += ntob(n % 64);
  }
  return invCode;
}

export async function openRegistration(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  if (!await Team.get(id)) throw new httpErrors["NotFound"]();
  let invitation;
  try {
    invitation = await ctx.request.body({ type: "json" }).value;
    if (typeof invitation !== "string") invitation = generateInvitationCode(id);
  } catch {
    throw new httpErrors["BadRequest"]();
  }
  if (!await Team.setInvitationCode(id, invitation)) {
    throw new httpErrors["Conflict"]();
  }
  ctx.response.status = 200;
}
export async function closeRegistration(ctx: RouterContext) {
  const id = ctx.params.id == null ? null : +ctx.params.id;
  if (id == null || isNaN(id)) throw new httpErrors["BadRequest"]();
  if (!await Team.setInvitationCode(id, null)) {
    throw new httpErrors["NotFound"]();
  }
  ctx.response.status = 200;
}
