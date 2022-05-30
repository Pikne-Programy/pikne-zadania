import { Logger } from "../services/mod.ts";
import { Context } from "../deps.ts";

export const LoggerMiddleware = (logger: Logger) =>
  async (ctx: Context, next: () => unknown) => {
    await next();

    logger.log(
      ctx.request.method,
      ctx.request.url.pathname,
      ctx.response.status,
    );
  };
