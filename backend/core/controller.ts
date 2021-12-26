import {
  httpErrors,
  ObjectTypeOf,
  RouterContext,
  SchemaObject,
  Status,
} from "../deps.ts";
import {
  validateBody,
  validateHeaders,
  validateQuery,
  validateParams,
  validateCookies,
} from "./mod.ts";

type defualt2Record<S> = S extends SchemaObject
  ? ObjectTypeOf<NonNullable<S>>
  : Record<string, never>;

type mapSchema<S extends ValidationSchema> = {
  [P in "body" | "headers" | "query" | "params" | "cookies"]: defualt2Record<
    S[P]
  >;
};

interface ValidationSchema<
  Body extends SchemaObject | undefined = SchemaObject | undefined,
  Headers extends SchemaObject | undefined = SchemaObject | undefined,
  Query extends SchemaObject | undefined = SchemaObject | undefined,
  Params extends SchemaObject | undefined = SchemaObject | undefined,
  Cookies extends SchemaObject | undefined = SchemaObject | undefined
> {
  body?: Body;
  headers?: Headers;
  query?: Query;
  params?: Params;
  cookies?: Cookies;
}
interface OakMiddleware {
  (ctx: RouterContext): unknown;
}

interface IController<S extends ValidationSchema> {
  status?: Status;
  //TODO auth:boolean
  handle: (ctx: RouterContext, payload: mapSchema<S>) => unknown;
}

export function controller<S extends ValidationSchema>(
  args: IController<S> & {
    schema: S;
  }
): OakMiddleware;
export function controller(
  args: IController<Record<string, undefined>>
): OakMiddleware;
export function controller<S extends ValidationSchema>({
  schema: maybeSchema,
  status,
  handle,
}: IController<S> & { schema?: S | undefined }): OakMiddleware {
  //
  const schema = maybeSchema || ({} as S);

  return async (ctx: RouterContext) => {
    ctx.response.status = status!; //can be assigned anyway

    const [body, headers, query, params, cookies] = await Promise.all(
      [
        schema.body && validateBody(ctx, schema.body),
        schema.headers && validateHeaders(ctx, schema.headers),
        schema.query && validateQuery(ctx, schema.query),
        schema.params && validateParams(ctx, schema.params),
        schema.cookies && validateCookies(ctx, schema.cookies),
      ].map((validation) => validation || Promise.resolve({}))
    )
      .then(
        (r) =>
          r as [
            defualt2Record<S["body"]>,
            defualt2Record<S["headers"]>,
            defualt2Record<S["query"]>,
            defualt2Record<S["params"]>,
            defualt2Record<S["cookies"]>
          ]
      )
      .catch(() => {
        throw new httpErrors["BadRequest"]();
      });

    return handle(ctx, { body, headers, query, params, cookies });
  };
}
