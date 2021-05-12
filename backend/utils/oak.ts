// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  _Context,
  _RouterContext,
  httpErrors,
  ObjectTypeOf,
  RouteParams,
  SchemaObject,
  vs,
} from "../deps.ts";
import { JSONType, User } from "../types/mod.ts";

export interface State {
  seed: number;
  user: User | null;
}
export type Context = _Context<State>;
export type RouterContext<P extends RouteParams = RouteParams> = _RouterContext<
  P,
  State
>;

function _placeholder(status: number, body?: JSONType) {
  return (ctx: RouterContext) => {
    ctx.response.status = status;
    ctx.response.body = body;
  };
}
export function placeholder(first: number | JSONType, body?: JSONType) {
  if (typeof first === "number") return _placeholder(first, body);
  else return _placeholder(200, first);
}

export function followSchema<T extends SchemaObject>(
  schema: T,
  cb: (ctx: RouterContext, req: ObjectTypeOf<T>) => Promise<void>,
) {
  return async (ctx: RouterContext) => {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      await cb(ctx, vs.applySchemaObject(schema, body));
    } catch (_) {
      throw new httpErrors["BadRequest"]();
    }
  };
}
