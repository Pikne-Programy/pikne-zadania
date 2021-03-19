import { httpErrors, RouterContext } from "../deps.ts";
import { validateJWT } from "../controllers/auth.ts";

function authorize(required: boolean) {
  return async (ctx: RouterContext, next: () => Promise<void>) => {
    const jwt = ctx.cookies.get("jwt");
    const user = jwt ? validateJWT(jwt) : null;
    if (required && !user) {
      throw new httpErrors["Forbidden"]();
    }
    ctx.state.user = user;
    await next();
  };
}

export const authReq = authorize(true);
export const authNotReq = authorize(false);
