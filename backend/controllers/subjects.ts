// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { subjectSchema } from "../types/mod.ts";
import { followSchema } from "../utils/mod.ts";

// TODO: permissions

export class SubjectsController {
  readonly create = followSchema({
    id: subjectSchema.id,
    users: subjectSchema.users,
  }, (ctx, _req) => {
    // TODO: Add subject to db
    ctx.response.status = 200;
  });

  readonly info = followSchema({
    id: subjectSchema.id,
  }, (ctx, _req) => {
    // TODO: Return list of users from db
    ctx.response.status = 200;
  });

  readonly permit = followSchema({
    id: subjectSchema.id,
    users: subjectSchema.users,
  }, (ctx, _req) => {
    // TODO: Return list of users from db
    ctx.response.status = 200;
  });
}
