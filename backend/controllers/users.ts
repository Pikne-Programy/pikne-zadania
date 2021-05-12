// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors } from "../deps.ts";
import { db, RouterContext } from "../utils/mod.ts";

export async function deleteUser(ctx: RouterContext) {
  const id = ctx.params.userid;
  if (!id) throw new httpErrors["BadRequest"]();
  if (!await db.deleteUser(id)) throw new httpErrors["NotFound"]();
  ctx.response.status = 204;
}
export function getUser(ctx: RouterContext) {
  const user = ctx.state.user!; // auth required
  ctx.response.status = 200;
  ctx.response.body = {
    name: user.name,
    team: user.team,
    number: user.role.name === "student" ? user.role.number : null,
  };
}
export async function setUserNumber(ctx: RouterContext) {
  const userid = ctx.params.userid;
  if (!userid) throw new httpErrors["BadRequest"]("Incorrect user id");
  let number;
  try {
    number = await ctx.request.body({ type: "json" }).value;
    if (number !== null && typeof number !== "number") throw "xd";
  } catch {
    throw new httpErrors["BadRequest"]();
  }
  const user = await db.getUser(userid);
  if (!user) throw new httpErrors["NotFound"]();
  if (user.role.name !== "student") {
    console.error("Only student can have a number");
    throw new httpErrors["Forbidden"]();
  }
  const part = {
    id: userid,
    role: {
      name: "student" as const,
      number,
      exercises: user.role.exercises,
    },
  };
  if (!await db.setUser(part)) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
}
