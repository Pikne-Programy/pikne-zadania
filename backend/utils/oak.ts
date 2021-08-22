// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  httpErrors,
  ObjectTypeOf,
  RouterContext,
  SchemaObject,
  vs,
} from "../deps.ts";
import { assertUnreachable } from "./mod.ts";
import { CustomDictError, JSONType } from "../types/mod.ts";

function _placeholder(status: number, body?: JSONType) {
  return (ctx: RouterContext): unknown => {
    ctx.response.status = status;
    ctx.response.body = body;
    return undefined;
  };
}
export function placeholder(first: number | JSONType, body?: JSONType) {
  if (typeof first === "number") return _placeholder(first, body);
  else return _placeholder(200, first);
}

export async function followSchema<T extends SchemaObject>(
  ctx: RouterContext,
  schema: T,
): Promise<ObjectTypeOf<T>> {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    return vs.applySchemaObject(schema, body);
  } catch (_) {
    throw new httpErrors["BadRequest"]();
  }
}

export function translateErrors<T>(err: T | CustomDictError) {
  if (!(err instanceof CustomDictError)) return err;
  switch (err.type) {
    case "ExerciseBadAnswerFormat":
    case "ExerciseBadFormat":
      throw new httpErrors["BadRequest"]();
    case "UserCredentialsInvalid":
    case "JWTNotFound":
      throw new httpErrors["Unauthorized"]();
    case "TeamInvitationNotFound":
      throw new httpErrors["Forbidden"]();
    case "UserNotFound":
    case "TeamNotFound":
    case "ExerciseNotFound":
      throw new httpErrors["NotFound"]();
    case "UserAlreadyExists":
    case "TeamAlreadyExists":
    case "SubjectAlreadyExists":
    case "ExerciseAlreadyExists":
      throw new httpErrors["Conflict"]();
    default:
      assertUnreachable(err.type);
  }
}
