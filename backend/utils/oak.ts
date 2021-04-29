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
import { assertUnreachable } from "./mod.ts";

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

export async function exists<T>(
  ctx: RouterContext,
  x: T,
  next: (x: T) => Promise<void> | void,
) {
  if (!x) throw new httpErrors["NotFound"]();
  ctx.response.status = 200;
  await next(x);
}

export async function safeJSONbody(
  ctx: RouterContext,
  schema: SchemaObject,
): Promise<ObjectTypeOf<typeof schema>> {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    return vs.applySchemaObject(schema, body);
  } catch (_) {
    throw new httpErrors["BadRequest"]();
  }
}

export async function safeJSONType(
  ctx: RouterContext,
  type: "string",
): Promise<string>;
export async function safeJSONType(
  ctx: RouterContext,
  type: "number",
): Promise<number>;
export async function safeJSONType(
  ctx: RouterContext,
  type: "boolean",
): Promise<boolean>;
export async function safeJSONType(
  ctx: RouterContext,
  type: "JSON",
): Promise<JSONType>;
export async function safeJSONType(
  ctx: RouterContext,
  type: "string" | "number" | "boolean" | "JSON",
): Promise<string | number | boolean | JSONType> {
  try {
    const body: JSONType = await ctx.request.body({ type: "json" }).value;
    switch (type) {
      case "string":
        if (typeof body !== "string") throw "";
        break;
      case "number":
        if (typeof body !== "number") throw "";
        break;
      case "boolean":
        if (typeof body !== "boolean") throw "";
        break;
      case "JSON":
        break;
      default:
        return assertUnreachable(type);
    }
    return body;
  } catch (_) {
    throw new httpErrors["BadRequest"]();
  }
}
