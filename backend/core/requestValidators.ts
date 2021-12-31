import { RouterContext, SchemaObject, vs } from "../deps.ts";

export const validateBody = <S extends SchemaObject>(
  ctx: RouterContext,
  schema: S,
) =>
  ctx.request
    .body({ type: "json" })
    .value.then((body) => vs.applySchemaObject<S>(schema, body));

export const validateHeaders = <S extends SchemaObject>(
  ctx: RouterContext,
  schema: S,
) => vs.applySchemaObject<S>(schema, Object.fromEntries(ctx.request.headers));

export const validateQuery = <S extends SchemaObject>(
  ctx: RouterContext,
  schema: S,
) =>
  vs.applySchemaObject<S>(
    schema,
    [...ctx.request.url.searchParams.entries()].reduce((acc, [key, value]) => {
      if (acc[key] === undefined) {
        acc[key] = value;
      }
      if (typeof acc[key] === "string") {
        acc[key] = [acc[key] as string, value];
      }
      if (Array.isArray(acc[key])) {
        (acc[key] as string[]).push(value);
      }
      return acc;
    }, {} as Record<string, string[] | string>),
  );

export const validateParams = <S extends SchemaObject>(
  ctx: RouterContext,
  schema: S,
) => vs.applySchemaObject<S>(schema, ctx.params);

export const validateCookies = <S extends SchemaObject>(
  ctx: RouterContext,
  schema: S,
) => vs.applySchemaObject<S>(schema, Object.fromEntries(ctx.cookies));
