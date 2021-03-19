import { RouterContext } from "../deps.ts";

export function deleteUser(ctx: RouterContext) {
  ctx.response.status = 200;
}
export function getUser(ctx: RouterContext) {
  ctx.response.status = 200;
  ctx.response.body = { "name": "User", "number": 11, "team": 1 };
}
export function setUserNumber(ctx: RouterContext) {
  ctx.response.status = 200;
}
