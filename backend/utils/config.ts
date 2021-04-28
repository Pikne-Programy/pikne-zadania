// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db, firsthash, secondhashSync, userhash } from "./mod.ts";
import { Algorithm } from "../deps.ts";
const algos = [
  "none",
  "HS256",
  "HS512",
  "RS256",
  "RS512",
  "PS256",
  "PS512",
] as const;
const _exhaustive: ReadonlyArray<Algorithm> = algos; // fails if algos contains unsupported algorithms
function isJWTAlgo(x?: string): x is Algorithm {
  return x != null && algos.includes(x as Algorithm); // fails if algos does not specifies all supported algorithms
}

export function get(type: "string", key: string, def?: string): string;
export function get(type: "number", key: string, def?: number): number;
export function get(type: "boolean", key: string, def?: boolean): boolean;
export function get(
  type: "string" | "number" | "boolean",
  key: string,
  def?: string | number | boolean,
): string | number | boolean {
  const env = Deno.env.get(key) ?? def;
  let x;
  switch (type) {
    case "string":
      x = env;
      break;
    case "number":
      x = +(env ?? NaN);
      if (isNaN(x)) x = null;
      break;
    case "boolean":
      if (typeof env == "string") {
        x = ["true", "yes", "1"].includes(env.toLocaleLowerCase());
      }
      break;
  }
  if (x == null) throw new Error(`${key} must be present`);
  return x;
}

const alg = Deno.env.get("JWT_ALG");
if (!isJWTAlgo(alg)) throw new Error(`JWT_ALG must equal one of ${algos}.`);
const key = get("string", "JWT_KEY");
const exp = get("number", "JWT_EXP");

const url = get("string", "MONGODB_URL", "mongodb://mongo:27017");
const database = get("string", "MONGODB_NAME", "pikne-zadania");
const time = get("number", "MONGODB_TIME", 5e3);

export const SEED_AGE = get("number", "SEED_AGE", 60 * 60 * 24 * 31 * 12 * 4);
export const LOGIN_TIME = get("number", "LOGIN_TIME", 2e3);
export const USER_SALT = get("string", "USER_SALT", "");
export const RNG_PREC = get("number", "RNG_PREC", 3);
export const ANSWER_PREC = get("number", "ANSWER_PREC", .02);
export const DECIMAL_POINT = get("boolean", "DECIMAL_POINT", true);
export const JWT_CONF = { exp, header: { alg, typ: "JWT" }, key };
export const MONGO_CONF = { db: database, url, time };

const ROOT_ENABLE = get("boolean", "ROOT_ENABLE", false);
const ROOT_PASS = Deno.env.get("ROOT_PASS");
const ROOT_DHPASS = Deno.env.get("ROOT_DHPASS");

export async function setuproot(
  register: (dhpassword: string) => Promise<unknown>,
  unregister: () => Promise<unknown>,
) {
  const warn = (what: string, why = "Please unset it or change ROOT_ENABLE.") =>
    console.warn(`WARN: ${what} is present. ${why}`);
  const root = await db.getUser(userhash("root"));
  if (ROOT_ENABLE) {
    warn("ROOT_ENABLE", "It can be a security issue.");
    if (ROOT_DHPASS) {
      if (ROOT_PASS) warn("ROOT_PASS");
      if (root && root.dhpassword == ROOT_DHPASS) {
        console.log("ROOT was not changed.");
      } else {
        await register(ROOT_DHPASS);
        console.warn("ROOT was registered with ROOT_DHPASS.");
      }
    } else {
      if (!(ROOT_PASS || root)) throw new Error("no credentials for root");
      if (ROOT_PASS) {
        console.log(new Date(), "Generating root password hash...");
        const dhpass = secondhashSync(firsthash("root", ROOT_PASS));
        console.log(new Date(), "Generated!");
        console.warn(`Please unset ROOT_PASS!`);
        console.warn(`Set ROOT_DHPASS=${dhpass} if needed.`);
        await register(dhpass);
        console.warn("ROOT was registered with ROOT_PASS.");
      }
    }
  } else {
    if (ROOT_PASS) warn("ROOT_PASS");
    if (ROOT_DHPASS) warn("ROOT_DHPASS");
    if (root) await unregister();
  }
}
