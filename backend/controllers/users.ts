// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, RouterContext } from "../deps.ts";
import { db, safeJSONType } from "../utils/mod.ts";
import { User } from "../types/mod.ts";

export async function deleteUser(ctx: RouterContext) {
  if (!ctx.params.userid) throw new httpErrors["BadRequest"]();
  const id = ctx.params.userid;
  if (!id) throw new httpErrors["BadRequest"]();
  if (!(await db.deleteUser(id))) throw new httpErrors["NotFound"]();
  ctx.response.status = 204;
}
export function getUser(ctx: RouterContext) {
  const user: User = ctx.state.user;
  ctx.response.status = 200;
  ctx.response.body = {
    name: user.name,
    team: user.team,
    number: user.role.name === "student" ? user.role.number : null,
  };
}
export async function setUserNumber(ctx: RouterContext) {
  if (!ctx.params.userid) {
    throw new httpErrors["BadRequest"]("Incorrect user id");
  }
  safeJSONType(ctx, "number");
  const num = await ctx.request.body({ type: "json" }).value;
  const user = await db.getUser(ctx.params.userid);
  if (!user) {
    throw new httpErrors["NotFound"]();
  }
  if (user.role.name !== "student") {
    console.error("Only student can have a number");
    throw new httpErrors["Forbidden"]();
  }
  if (!(await db.setUser({
      id: ctx.params.userid,
      role: { name: "student", number: num, exercises: user.role.exercises },
    }))
  ) {
    throw new httpErrors["NotFound"]();
  }
  ctx.response.status = 200;
}
