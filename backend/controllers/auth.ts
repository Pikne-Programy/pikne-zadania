// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  compare,
  create,
  getNumericDate,
  httpErrors,
  Payload,
  verify,
  vs,
} from "../deps.ts";
import { teamSchema, userSchema } from "../types/mod.ts";
import {
  delay,
  followSchema,
  handleThrown,
  RouterContext,
  secondhash,
  Team,
  User,
  userhash,
} from "../utils/mod.ts";
import { generateSeed, JWT_CONF, LOGIN_TIME } from "../utils/mod.ts";

export const login = followSchema({
  login: userSchema.login,
  hashed_password: userSchema.hpassword,
}, async (ctx, req) => {
  const startTime = Date.now();
  const dhpassword = (await User.get(userhash(req.login)))?.dhpassword ?? "";
  if (await compare(req.hashed_password, dhpassword)) {
    const jwt = await makeJWT(userhash(req.login));
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
  console.log(`login: ${req.login} ${ctx.response.status} ${time} ms`);
});
export async function logout(ctx: RouterContext) {
  const user = ctx.state.user?.id;
  if (!user) throw new httpErrors["Forbidden"]();
  const jwt = ctx.cookies.get("jwt") ?? "";
  await User.deleteJWT(user, jwt);
  ctx.cookies.delete("jwt");
  ctx.response.status = 200;
  console.log(`logout: ${user} ${ctx.response.status}`);
}
export const register = followSchema({
  login: vs.email(),
  name: userSchema.name,
  hashed_password: userSchema.hpassword,
  number: userSchema.number,
  invitation: teamSchema.invCode,
}, async (ctx, req) => {
  const team = await Team.getInvitation(req.invitation);
  if (!team) throw new httpErrors["Forbidden"]();
  const user = {
    email: req.login,
    name: req.name,
    dhpassword: await secondhash(req.hashed_password),
    team,
    tokens: [],
    seed: generateSeed(),
    role: team > 1
      ? { name: "student" as const, number: req.number, exercises: {} }
      : { name: "teacher" as const },
  };
  if (!await User.add(user)) throw new httpErrors["Conflict"]();
  ctx.response.status = 201;
  console.log(`register: ${user.name}`);
});
const payload = (login: string) => {
  const payload: Payload = { id: login, exp: getNumericDate(JWT_CONF.exp) };
  return payload;
};

async function makeJWT(uid: string): Promise<string | null> {
  try {
    const jwt = await create(JWT_CONF.header, payload(uid), JWT_CONF.key);
    await User.addJWT(uid, jwt);
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
    if (typeof user === "string" && await User.existsJWT(user, jwt)) {
      return user;
    }
  } catch (e) {
    handleThrown(e);
  }
  return null;
}
