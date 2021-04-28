// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// deno-lint-ignore-file camelcase
import {
  compare,
  create,
  getNumericDate,
  httpErrors,
  Payload,
  RouterContext,
  verify,
} from "../deps.ts";
import { endpointSchema as endpoint } from "../types/mod.ts";
import {
  db,
  delay,
  handleThrown,
  safeJSONbody,
  secondhash,
  userhash,
} from "../utils/mod.ts";
import { generateSeed, JWT_CONF, LOGIN_TIME } from "../utils/mod.ts";

export async function login(ctx: RouterContext) {
  const startTime = Date.now();
  const { login, hashed_password } = await safeJSONbody(ctx, endpoint.login);
  const dhpassword = (await db.getUser(userhash(login)))?.dhpassword ?? "";
  if (await compare(hashed_password, dhpassword)) {
    const jwt = await makeJWT(userhash(login));
    if (!jwt) throw new httpErrors["Unauthorized"]();
    ctx.cookies.set("jwt", jwt);
    ctx.response.status = 200;
  } else {
    const remainedTime = startTime + LOGIN_TIME - Date.now();
    if (remainedTime > 0) await delay(remainedTime); // preventing timing attack
    else console.error(`Missed LOGIN_TIME by ${remainedTime} ms.`);
    ctx.response.status = 401;
  }
  const time = Date.now() - startTime;
  console.log(`login: ${login} ${ctx.response.status} ${time} ms`);
}
export async function logout(ctx: RouterContext) {
  const user = ctx.state.user?.id;
  if (!user) throw new httpErrors["Forbidden"]();
  const jwt = ctx.cookies.get("jwt") ?? "";
  await db.deleteJWT(user, jwt);
  ctx.cookies.delete("jwt");
  ctx.response.status = 200;
  console.log(`logout: ${user} ${ctx.response.status}`);
}
export async function register(ctx: RouterContext) {
  const { login, name, hashed_password, number, invitation } =
    await safeJSONbody(ctx, endpoint.register);
  const team = await db.getInvitation(invitation);
  if (!team) throw new httpErrors["NotFound"]();
  const user = {
    email: login,
    name,
    dhpassword: await secondhash(hashed_password),
    team,
    tokens: [],
    seed: generateSeed(),
    role: team > 1
      ? { name: "student" as const, number, exercises: {} }
      : { name: "teacher" as const },
  };
  if (!await db.addUser(user)) throw new httpErrors["Conflict"]();
  ctx.response.status = 201;
  console.log(`register: ${user.name}`);
}
const payload = (login: string) => {
  const payload: Payload = { id: login, exp: getNumericDate(JWT_CONF.exp) };
  return payload;
};

async function makeJWT(uid: string): Promise<string | null> {
  try {
    const jwt = await create(JWT_CONF.header, payload(uid), JWT_CONF.key);
    await db.addJWT(uid, jwt);
    return jwt;
  } catch (e) {
    handleThrown(e);
    return null;
  }
}

export async function validateJWT(jwt: string): Promise<string | null> {
  try {
    const payload: Payload = await verify(
      jwt,
      JWT_CONF.key,
      JWT_CONF.header.alg,
    );
    const user = payload.id;
    if (typeof user === "string" && await db.existsJWT(user, jwt)) return user;
  } catch (e) {
    handleThrown(e);
  }
  return null;
}
