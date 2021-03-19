import { RouterContext } from "../deps.ts";

export function getAllTeams(ctx: RouterContext) {
  ctx.response.status = 200;
  ctx.response.body = [
    { "id": 1, "name": "Teachers", "assignee": "Smith", "open": true },
    { "id": 2, "name": "2d", "assignee": "Williams", "open": true },
    { "id": 3, "name": "3d", "assignee": "Williams", "open": false },
  ];
}
export function addTeam(ctx: RouterContext) {
  ctx.response.status = 201;
}
export function getTeam(ctx: RouterContext) {
  ctx.response.status = 200;
  ctx.response.body = {
    "name": "2d",
    "assignee": "Williams",
    "members": [{
      "id": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "name": "User",
      "number": 11,
    }],
  };
}
export function setTeamName(ctx: RouterContext) {
  ctx.response.status = 200;
}
export function changeAssignee(ctx: RouterContext) {
  ctx.response.status = 200;
}

export function openRegistration(ctx: RouterContext) {
  ctx.response.status = 200;
}
export function closeRegistration(ctx: RouterContext) {
  ctx.response.status = 200;
}
