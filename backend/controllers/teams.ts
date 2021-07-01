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
    open: team.invitation !== null,
  }));
}
export const addTeam = followSchema(
  { name: teamSchema.nameReq },
  async (ctx, req) => {
    const user = ctx.state.user!; // auth required
    const teamid = await Team.add({
      "name": req.name,
      "assignee": user.name,
      "members": [],
      "invitation": null,
    });
    if (!teamid) {
      throw new httpErrors["Forbidden"]();
    }
    ctx.response.status = 201;
    ctx.response.body = teamid;
  },
);

export const deleteTeam = followSchema(
  { id: teamSchema.id },
  async (ctx, req) => {
    const team = await Team.get(req.id);
    if (!team) throw new httpErrors["NotFound"]();
    if (!await Team.delete(req.id)) throw new httpErrors["Forbidden"]();
    ctx.response.status = 200;
  },
);

export const getTeam = followSchema({ id: teamSchema.id }, async (ctx, req) => {
  const team = await Team.get(req.id);
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
    } else console.warn(`${member} not in team ${req.id}`);
  }
  ctx.response.status = 200;
  ctx.response.body = {
    "name": team.name,
    "assignee": team.assignee,
    "invitation": team.invitation,
    "members": members,
  };
});

function generateInvitationCode(id: number): string {
  const ntob = (n: number): string => {
    const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
      "abcdefghijklmnopqrstuvwxyz0123456789+/";
    return base64[n];
  };
  const randomArray = new Uint8Array(4);
  window.crypto.getRandomValues(randomArray);
  let invitation = ntob(id);
  for (const n of randomArray) {
    invitation += ntob(n % 64);
  }
  return invitation;
}
export const updateTeam = followSchema({
  id: teamSchema.id,
  invitation: teamSchema.invitation,
  assignee: teamSchema.assignee,
  name: teamSchema.name,
}, async (ctx, req) => {
  console.log(123);
  const team = await Team.get(req.id);
  if (!team) throw new httpErrors["NotFound"]();
  if (req.invitation === "") team.invitation = generateInvitationCode(req.id);
  else if (req.invitation === "null") team.invitation = null;
  else if (req.invitation !== null) team.invitation = req.invitation;
  if (req.name !== null) team.name = req.name;
  if (req.assignee !== null) {
    const assignee = await User.get(req.assignee);
    if (!assignee) {
      console.error(`updateTeam: User with id ${req.assignee} doesn't exist`);
      throw new httpErrors["Conflict"]();
    }
    team.assignee = assignee.name;
  }
  if (!await Team.set(team)) throw new httpErrors["InternalServerError"]();
  ctx.response.status = 200;
});
