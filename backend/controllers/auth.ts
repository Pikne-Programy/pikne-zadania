import { RouterContext } from "../deps.ts";
import { User } from "../types/user.ts";

export function login(ctx: RouterContext) {
  ctx.response.status = 200;
}
export function logout(ctx: RouterContext) {
  ctx.response.status = 200;
}
export function register(ctx: RouterContext) {
  ctx.response.status = 201;
}

function makeJWT(uid: string): string {
  return "";
}
export function validateJWT(jwt: string): User | null {
  return null;
}
