// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  _Context,
  _Router,
  _RouterContext,
  httpErrors,
  ObjectTypeOf,
  RouteParams,
  SchemaObject,
  vs,
} from "../deps.ts";
import { JSONType } from "../types/mod.ts";
import { User } from "../models/mod.ts";

export interface State {
  seed: number;
  user: User | null;
}
export type Context = _Context<State>;
export type RouterContext<P extends RouteParams = RouteParams> = _RouterContext<
  P,
  State
>;
export class Router extends _Router<RouteParams, State> {}

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
  } catch (e) {
    throw new httpErrors["BadRequest"]();
  }
}
