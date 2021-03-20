import { browserCrypto, Random, RouterContext } from "../deps.ts";
import { generateSeed } from "../utils/mod.ts";

function setSeed(ctx: RouterContext, seed: number) {
  ctx.state.seed = seed;
  ctx.cookies.set(
    "seed",
    seed.toString(),
    { maxAge: 60 * 60 * 24 * 31 * 12 * 4 },
  );
}
export async function seed(ctx: RouterContext, next: () => Promise<void>) {
  if (ctx.state.user) {
    setSeed(ctx, ctx.state.user.seed);
  } else if (isNaN(+(ctx.cookies.get("seed") ?? NaN))) {
    setSeed(ctx, generateSeed());
  } else ctx.state.seed = +ctx.cookies.get("seed")!;
  await next();
}
