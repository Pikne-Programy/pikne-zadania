import { Logger } from "../services/mod.ts";
import { Context, HttpError, httpErrors } from "../deps.ts";

const die = (ctx: Context, { status, message }: HttpError) => {
  ctx.response.status = status;
  ctx.response.body = { status, message };
};

const normalize2HttpError = (e: unknown) =>
  e instanceof HttpError
    ? e
    : new httpErrors["InternalServerError"](
        e instanceof Error ? e.message : ""
      );

export const ErrorHandlerMiddleware =
  (logger: Logger) => async (ctx: Context, next: () => unknown) => {
    try {
      await next();
    } catch (e: unknown) {
      const error = normalize2HttpError(e);

      die(ctx, error);

      if (error.status) {
        logger.recogniseAndTrace(e);
      }
    } finally {
      logger.log(
        ctx.request.method,
        ctx.request.url.pathname,
        ctx.response.status
      );
    }
  };
