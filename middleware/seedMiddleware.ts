import { browserCrypto, Random, RouterContext } from "../deps.ts";
export const seed = async (ctx: RouterContext, next: () => Promise<void>) => {
  ctx.state.seed = +(ctx.cookies.get("seed") ?? NaN);
  if (isNaN(ctx.state.seed)) {
    ctx.state.seed = new Random(browserCrypto).int32();
    ctx.cookies.set(
      "seed",
      ctx.state.seed.toString(),
      {
        maxAge: 60 * 60 * 24 * 31 * 12 * 4,
      },
    );
  }
  await next();
};
