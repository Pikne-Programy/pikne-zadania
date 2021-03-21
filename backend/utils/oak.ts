import {
  httpErrors,
  ObjectTypeOf,
  RouterContext,
  SchemaObject,
  vs,
} from "../deps.ts";
import { JSONType } from "../types/mod.ts";

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

export async function predictDeath(
  ctx: RouterContext,
  inner: () => Promise<void>,
) { // TODO: get rid off
  try {
    await inner();
  } catch (e) {
    ctx.response.status = 500;
    ctx.response.body = { msg: e.message };
    console.error(e.message, e.stack);
  }
}

export async function exists<T>(
  ctx: RouterContext,
  x: T,
  next: (x: T) => Promise<void>,
) {
  if (x) {
    ctx.response.status = 200;
    await next(x);
  } else ctx.response.status = 404;
}

export async function safeJSONbody(
  ctx: RouterContext,
  schema: SchemaObject,
): Promise<ObjectTypeOf<typeof schema>> {
  try {
    return vs.applySchemaObject(
      schema,
      await ctx.request.body({ type: "json" }).value,
    );
  } catch (e) {
    throw new httpErrors["BadRequest"]();
  }
}
