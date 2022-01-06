import { httpErrors, RouterContext, Status } from "../deps.ts";
import {
  validateBody,
  validateCookies,
  validateHeaders,
  validateParams,
  validateQuery,
} from "./mod.ts";
import {
  AuthOptions2User,
  defaultSchema,
  IAuthOptions,
  mapSchema,
  props,
  ValidationSchema,
} from "./types/controller/mod.ts";

interface OakMiddleware {
  (ctx: RouterContext): unknown;
}

interface IController<
  S extends ValidationSchema | undefined | never,
  A extends IAuthOptions,
  U,
> {
  auth?: A;
  schema?: S;
  status?: Status;
  handle: (
    ctx: RouterContext,
    payload: mapSchema<defaultSchema<S>> & { user: AuthOptions2User<A, U> },
  ) => unknown;
}

export abstract class Controller<U = never> {
  abstract auth<A extends IAuthOptions>(
    ctx: RouterContext,
    options: A,
  ): AuthOptions2User<A, U> | Promise<AuthOptions2User<A, U>>;

  route<
    S extends ValidationSchema | undefined | never = undefined,
    A extends IAuthOptions = undefined,
  >({
    status,
    handle,
    schema = {},
    auth,
  }: IController<S, A, U>): OakMiddleware {
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
        typeof validators[props],
      ][];

      const parsed = await Promise.all(
        entries.map(
          async ([prop, validator]) =>
            [
              prop,
              schema[prop] ? await validator(ctx, schema[prop]!) : {},
            ] as const,
        ),
      ).then<mapSchema<defaultSchema<S>>, never>(Object.fromEntries, () => {
        throw new httpErrors["BadRequest"]();
      });

      const user = await this.auth(ctx, auth);

      return handle(ctx, { ...parsed, user: user! });
    };
  }
}
