import { compare, RouterContext } from "../deps.ts";
import { User } from "../types/mod.ts";
import { delay, getUser, safeJSONbody, userhash } from "../utils/mod.ts";

const loginTime = 2e3;

export async function login(ctx: RouterContext) {
  const startTime = Date.now();
  // deno-lint-ignore camelcase
  const { login, hashed_password } = await safeJSONbody(ctx) as {
    login: string;
    hashed_password: string;
  }; // TODO
  const { dhpassword } = getUser(userhash(login)) ?? { dhpassword: "" };
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
  ctx.response.status = 200;
  ctx.cookies.delete("jwt");
}
export function register(ctx: RouterContext) {
  ctx.response.status = 201;
}

function makeJWT(ctx: RouterContext, login: string) {
  // TODO
  ctx.cookies.set("jwt", "xd");
}
export function validateJWT(jwt: string): User | null {
  // TODO
  return jwt == "xd"
    ? { role: "admin", id: "", name: "", dhpassword: "", tokens: [], seed: 0 }
    : null;
}
