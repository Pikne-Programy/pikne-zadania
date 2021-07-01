// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors } from "../deps.ts";
import { followSchema, RouterContext, User } from "../utils/mod.ts";
import { userSchema } from "../types/mod.ts";

export const deleteUser = followSchema(
  { id: userSchema.id },
  async (ctx, req) => {
    if (!await User.delete(req.id)) throw new httpErrors["NotFound"]();
    ctx.response.status = 204;
  },
);

export const current = (ctx: RouterContext) => {
  const user = ctx.state.user!; // auth required
  ctx.response.status = 200;
  ctx.response.body = {
    name: user.name,
    team: user.team,
    number: user.role.name === "student" ? user.role.number : null,
  };
};
export const userInfo = followSchema(
  { id: userSchema.id },
  async (ctx, req) => {
    const user = await User.get(req.id);
    if (!user) throw new httpErrors["NotFound"]();
    ctx.response.status = 200;
    ctx.response.body = {
      name: user.name,
      team: user.team,
      number: user.role.name === "student" ? user.role.number : null,
    };
  },
);
export const updateUser = followSchema({
  id: userSchema.id,
  number: userSchema.number,
  name: userSchema.name,
}, async (ctx, req) => {
  const user = await User.get(req.id);
  if (!user) throw new httpErrors["NotFound"]();
  if (!req.name) req.name = user.name;
  if (!isNaN(req.number)) {
    if (user.role.name !== "student") {
      console.error("Only student can have a number");
      throw new httpErrors["Forbidden"]();
    }
    user.role.number = req.number;
  }
  const part = {
    id: req.id,
    name: req.name,
    role: user.role.name !== "student" ? undefined : {
      name: "student" as const,
      number: user.role.number,
      exercises: user.role.exercises,
    },
  };
  if (!await User.set(part)) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
});
