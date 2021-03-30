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

export async function exists<T>(
  ctx: RouterContext,
  x: T,
  next: (x: T) => Promise<void> | void,
) {
  if (x) {
    ctx.response.status = 200;
    await next(x);
  } else throw new httpErrors["NotFound"]();
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

export async function safeJSONType(ctx: RouterContext, type: string) {
  const body = await ctx.request.body({ type: "json" }).value;
  if (!body || (typeof body !== "string" && typeof body !== "number")) throw new httpErrors["BadRequest"]();
  switch (type) {
    case "string": {
      if (typeof body !== "string") throw new httpErrors["BadRequest"]();
      break;
    }
    case "number": {
      if (!body || isNaN(+body)) throw new httpErrors["BadRequest"]();
      break;
    }
  }
}
