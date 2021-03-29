import { compare, RouterContext } from "../deps.ts";
import { endpointSchema as endpoint, User } from "../types/mod.ts";
import { db, delay, safeJSONbody, userhash } from "../utils/mod.ts";

const loginTime = 2e3;

export async function login(ctx: RouterContext) {
  const startTime = Date.now();
  // deno-lint-ignore camelcase
  const { login, hashed_password } = await safeJSONbody(ctx, endpoint.login);
  const { dhpassword } = await db.getUser(userhash(login)) ?? { dhpassword: "" };
  if (await compare(hashed_password, dhpassword)) {
    ctx.response.status = 200;
    makeJWT(ctx, login);
  } else {
    ctx.response.status = 401;
    const remainedTime = startTime + loginTime - Date.now();
    if (remainedTime > 0) {
      await delay(remainedTime); // preventing timing attack
    } else {
      console.error(`Missed loginTime by ${remainedTime} ms.`);
    }
  }
  const time = Date.now() - startTime;
  console.log(`login: ${login} ${ctx.response.status} ${time} ms`);
}
export function logout(ctx: RouterContext) {
  // TODO
  ctx.response.status = 200;
  ctx.cookies.delete("jwt");
  console.log(`logout: ${null}`);
}
export function register(ctx: RouterContext) {
  // TODO
  ctx.response.status = 201;
  console.log(`register: ${null} ${ctx.response.status}`);
}

function makeJWT(ctx: RouterContext, login: string) {
  // TODO
  ctx.cookies.set("jwt", "xd");
}
export function validateJWT(jwt: string): User | null {
  // TODO
  return jwt == "xd"? { role: { name: "admin" }, id: "", email: "", name: "", dhpassword: "", team: 0, tokens: [], seed: 0 }: null;
}
