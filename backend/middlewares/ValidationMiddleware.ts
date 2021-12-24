import {
  httpErrors,
  ObjectTypeOf,
  RouterContext,
  SchemaObject,
  vs,
} from "../deps.ts";

export const ValidatorMiddleware =
  <T extends SchemaObject>(
    schema: T,
    controller: (ctx: RouterContext, body: ObjectTypeOf<T>) => unknown
  ) =>
  (ctx: RouterContext) =>
    ctx.request
      .body({ type: "json" })
      .value.then((body) => vs.applySchemaObject(schema, body))
      .catch(() => {
        throw new httpErrors["BadRequest"]();
      })
      .then((parsedBody) => controller(ctx, parsedBody));
