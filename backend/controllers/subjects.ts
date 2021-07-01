// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { followSchema } from "../utils/mod.ts";
import { subjectSchema } from "../types/mod.ts";

export const create = followSchema({
  id: subjectSchema.id,
  users: subjectSchema.users,
}, (ctx, _req) => {
  //TODO: Add subject to db
  ctx.response.status = 200;
});

export const info = followSchema({
  id: subjectSchema.id,
}, (ctx, _req) => {
  //TODO: Return list of users from db
  ctx.response.status = 200;
});
export const permit = followSchema({
  id: subjectSchema.id,
  users: subjectSchema.users,
}, (ctx, _req) => {
  //TODO: Return list of users from db
  ctx.response.status = 200;
});
