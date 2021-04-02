// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// deno-lint-ignore-file camelcase
import {
  compare,
  create,
  getNumericDate,
  Header,
  httpErrors,
  Payload,
  RouterContext,
  verify,
} from "../deps.ts";
import { endpointSchema as endpoint } from "../types/mod.ts";
import { db, delay, safeJSONbody, secondhash, userhash } from "../utils/mod.ts";
import { generateSeed } from "../utils/mod.ts";

const key = "super-secert-key";
const header: Header = { alg: "HS512", typ: "JWT" }; // TODO make it invisible 
const loginTime = 2e3;

export async function login(ctx: RouterContext) {
  const startTime = Date.now();
  const { login, hashed_password } = await safeJSONbody(ctx, endpoint.login);
  const { dhpassword } = (await db.getUser(userhash(login))) ?? {
    dhpassword: "",
  };
  if (await compare(hashed_password, dhpassword)) {
    const jwt = await makeJWT(userhash(login));
    if (!jwt) {
      throw new httpErrors["Unauthorized"]();
    }
    ctx.cookies.set("jwt", jwt);
    ctx.response.status = 200;
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
export async function logout(ctx: RouterContext) {
  const user = ctx.state.user.id;
  if (!user) {
    throw new httpErrors["Forbidden"]();
  }
  const cookies = ctx.cookies.get("jwt") ?? "";
  await db.deleteJWT(user, cookies);
  ctx.cookies.delete("jwt");
  ctx.response.status = 200;
  console.log(`logout: ${user} ${ctx.response.status}`);
}
export async function register(ctx: RouterContext) {
  if (!ctx.request.hasBody) {
    throw new httpErrors["BadRequest"]();
  }
  const { login, name, hashed_password, number, invitation,} = await safeJSONbody(ctx, endpoint.register);
  const team = await db.getInvitation(invitation);
  if (!team) {
    throw new httpErrors["NotFound"]();
  }
  const user = {
    email: login,
    name,
    dhpassword: secondhash(hashed_password),
    team,
    tokens: [],
    seed: generateSeed(),
  };
  if (
    !(await db.addUser({
      ...user,
      role: team > 1 ? { name: "student", number, exercises: {} } : { name: "teacher" },
    }))
  ) {
    throw new httpErrors["Conflict"]();
  }
  ctx.response.status = 201;
  console.log(`register: ${user.name}`);
}
const payload = (login: string) => {
  const payload: Payload = {
    id: login,
    exp: getNumericDate(7 * 24 * 60 * 60), // 7 * 24h
  };
  return payload;
};

async function makeJWT(uid: string): Promise<string | null> {
  try {
    const jwt: string = await create(header, payload(uid), key);
    await db.addJWT(uid, jwt);
    return jwt;
  } catch (e) {
    return null;
  }
}

export async function validateJWT(jwt: string): Promise<string | null> {
  try {
    const payload: Payload = await verify(jwt, key, header.alg);
    const user = payload.id;
    if (typeof user === "string") {
      if (await db.existsJWT(user, jwt)) {
        return user;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}
