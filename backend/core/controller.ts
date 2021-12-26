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

type props = keyof ValidationSchema;

type defualt2Record<S> = S extends SchemaObject
  ? ObjectTypeOf<NonNullable<S>>
  : Record<string, never>;

type mapSchema<S extends ValidationSchema> = {
  [P in props]: defualt2Record<S[P]>;
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
  status,
  handle,
  schema = {} as S,
}: IController<S> & { schema?: S | undefined }): OakMiddleware {
  return async (ctx: RouterContext) => {
    ctx.response.status = status!; //can be assigned anyway

    const validators = {
      body: validateBody,
      headers: validateHeaders,
      query: validateQuery,
      params: validateParams,
      cookies: validateCookies,
    };

    const entries = Object.entries(validators) as [
      props,
      typeof validators[props]
    ][];

    const parsed = await Promise.all(
      entries.map(
        async ([prop, validator]) =>
          [
            prop,
            schema[prop] ? await validator(ctx, schema[prop]!) : {},
          ] as const
      )
    ).then<mapSchema<S>, never>(Object.fromEntries, () => {
      throw new httpErrors["BadRequest"]();
    });

    return handle(ctx, parsed);
  };
}
