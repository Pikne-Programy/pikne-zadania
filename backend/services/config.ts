// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Algorithm } from "../deps.ts";
import { firsthash, secondhashSync } from "../utils/mod.ts";
import { IConfig } from "../interfaces/mod.ts";

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

function get(type: "string", key: string, def?: string): string;
function get(type: "number", key: string, def?: number): number;
function get(type: "boolean", key: string, def?: boolean): boolean;
function get(
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
      x = (typeof env == "string")
        ? ["true", "yes", "1"].includes(env.toLocaleLowerCase())
        : env;
      break;
  }
  if (x == null) throw new Error(`${key} must be present`);
  return x;
}

export class Config implements IConfig {
  readonly SEED_AGE: number;
  readonly LOGIN_TIME: number;
  readonly USER_SALT: string;
  readonly RNG_PREC: number;
  readonly ANSWER_PREC: number;
  readonly DECIMAL_POINT: boolean;
  readonly JWT_CONF: {
    exp: number;
    header: { alg: Algorithm; typ: "JWT" };
    key: string;
  };
  readonly MONGO_CONF: { db: string; url: string; time: number };

  private readonly ROOT_ENABLE: boolean;
  private readonly ROOT_PASS?: string;
  private readonly ROOT_DHPASS?: string;

  constructor() {
    const alg = Deno.env.get("JWT_ALG");
    if (!isJWTAlgo(alg)) throw new Error(`JWT_ALG must equal one of ${algos}.`);
    this.JWT_CONF = {
      exp: get("number", "JWT_EXP"),
      header: { alg, typ: "JWT" },
      key: get("string", "JWT_KEY"),
    };

    this.MONGO_CONF = {
      db: get("string", "MONGODB_NAME", "pikne-zadania"),
      url: get("string", "MONGODB_URL", "mongodb://mongo:27017"),
      time: get("number", "MONGODB_TIME", 5e3),
    };

    this.SEED_AGE = get("number", "SEED_AGE", 60 * 60 * 24 * 31 * 12 * 4);
    this.LOGIN_TIME = get("number", "LOGIN_TIME", 2e3);
    this.USER_SALT = get("string", "USER_SALT", "");
    this.RNG_PREC = get("number", "RNG_PREC", 3);
    this.ANSWER_PREC = get("number", "ANSWER_PREC", .01);
    this.DECIMAL_POINT = get("boolean", "DECIMAL_POINT", true);

    this.ROOT_ENABLE = get("boolean", "ROOT_ENABLE", false);
    this.ROOT_PASS = Deno.env.get("ROOT_PASS");
    this.ROOT_DHPASS = Deno.env.get("ROOT_DHPASS");
  }

  async setuproot(
    register: (dhpassword: string) => Promise<unknown>,
    unregister: () => Promise<unknown>,
    check: () => Promise<{ dhpassword: string } | null>,
  ) {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE.",
    ) => console.warn(`WARN: ${what} is present. ${why}`);
    const root = await check();
    if (this.ROOT_ENABLE) {
      warn("ROOT_ENABLE", "It can be a security issue.");
      if (this.ROOT_DHPASS) {
        if (this.ROOT_PASS) warn("ROOT_PASS");
        if (root && root.dhpassword == this.ROOT_DHPASS) {
          console.log("ROOT was not changed.");
        } else {
          await register(this.ROOT_DHPASS);
          console.warn("ROOT was registered with ROOT_DHPASS.");
        }
      } else {
        if (!(this.ROOT_PASS || root)) {
          throw new Error("no credentials for root");
        }
        if (this.ROOT_PASS) {
          console.log(new Date(), "Generating root password hash...");
          const dhpass = secondhashSync(firsthash("root", this.ROOT_PASS));
          console.log(new Date(), "Generated!");
          console.warn(`Please unset ROOT_PASS!`);
          console.warn(`Set ROOT_DHPASS=${dhpass} if needed.`);
          await register(dhpass);
          console.warn("ROOT was registered with ROOT_PASS.");
        }
      }
    } else {
      if (this.ROOT_PASS) warn("ROOT_PASS");
      if (this.ROOT_DHPASS) warn("ROOT_DHPASS");
      if (root) await unregister();
    }
  }
}
