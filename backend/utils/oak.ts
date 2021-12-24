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
import { CustomDictError } from "../types/mod.ts";
//TODO validator decorator | middleware
export async function followSchema<T extends SchemaObject>(
  ctx: RouterContext,
  schema: T
): Promise<ObjectTypeOf<T>> {
  try {
    const body = await ctx.request.body({ type: "json" }).value;

    return vs.applySchemaObject(schema, body);
  } catch {
    throw new httpErrors["BadRequest"]();
  }
}

const errors = {
  ExerciseBadAnswerFormat: "BadRequest",
  ExerciseBadFormat: "BadRequest",
  
  UserCredentialsInvalid: "Unauthorized",
  JWTNotFound: "Unauthorized",
  TeamInvitationNotFound: "Forbidden",

  UserNotFound: "NotFound",
  TeamNotFound: "NotFound",
  SubjectNotFound: "NotFound",
  ExerciseNotFound: "NotFound",

  UserAlreadyExists: "Conflict",
  TeamAlreadyExists: "Conflict",
  SubjectAlreadyExists: "Conflict",
  ExerciseAlreadyExists: "Conflict",
} as const;

export function translateErrors<T>(err: T | CustomDictError) {
  if (!(err instanceof CustomDictError)) {
    return err;
  }

  const httpErrorClass = httpErrors[errors[err.type]];

  if (httpErrorClass) {
    throw new httpErrorClass();
  }

  assertUnreachable(0 as never);
}
