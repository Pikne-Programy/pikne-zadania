// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
//FIXME pointless
const _exhaustive: ReadonlyArray<Algorithm> = algos; // fails if algos contains unsupported algorithms
const isJWTAlgo = (x?: string): x is Algorithm =>
  x != null && algos.includes(x as Algorithm); // fails if algos does not specifies all supported algorithms

const isCorrectVerbosity = (x: number): x is 0 | 1 | 2 | 3 | 4 =>
  [0, 1, 2, 3, 4].includes(x);

function getEnv(type: "string", key: string, def?: string): string;
function getEnv(type: "number", key: string, def?: number): number;
function getEnv(type: "boolean", key: string, def?: boolean): boolean;
function getEnv(
  type: "string" | "number" | "boolean",
  key: string,
  def?: string | number | boolean
): string | number | boolean {
  const env = Deno.env.get(key) ?? def;

  const parsers = {
    string: () => env,
    number: () => {
      const number = Number(env);
      return isNaN(number) ? null : number;
    },
    boolean: () =>
      typeof env == "string"
        ? ["true", "yes", "1"].includes(env.toLocaleLowerCase())
        : (env as undefined),
  };
  const result = parsers[type]();

  if (result == null) {
    throw new Error(`${key} must be present`);
  }

  return result;
}

//FIXME
//TODO parse with vs?
export class ConfigService {
  readonly SEED_AGE: number;
  readonly LOGIN_TIME: number;
  readonly USER_SALT: string;
  readonly RNG_PREC: number;
  readonly ANSWER_PREC: number;
  readonly DECIMAL_POINT: boolean;
  readonly VERBOSITY: 0 | 1 | 2 | 3 | 4;
  readonly JWT_CONF: {
    exp: number;
    header: { alg: Algorithm; typ: "JWT" };
    key: string;
  };
  readonly MONGO_CONF: { db: string; url: string; time: number };
  readonly ROOT_CONF: {
    enable: boolean;
    password?: string;
    dhPassword?: string;
  };
  readonly FRESH: boolean;
  readonly EXERCISES_PATH: string;

  constructor() {
    const alg = Deno.env.get("JWT_ALG");

    if (!isJWTAlgo(alg)) {
      throw new Error(`JWT_ALG must equal one of ${algos}.`);
    }

    this.JWT_CONF = {
      exp: getEnv("number", "JWT_EXP"),
      header: { alg, typ: "JWT" },
      key: getEnv("string", "JWT_KEY"),
    };

    this.MONGO_CONF = {
      db: getEnv("string", "MONGODB_NAME", "pikne-zadania"),
      url: getEnv("string", "MONGODB_URL", "mongodb://mongo:27017"),
      time: getEnv("number", "MONGODB_TIME", 5e3),
    };

    this.ROOT_CONF = {
      enable: getEnv("boolean", "ROOT_ENABLE", false),
      password: Deno.env.get("ROOT_PASS"),
      dhPassword: Deno.env.get("ROOT_DHPASS"),
    };

    this.SEED_AGE = getEnv("number", "SEED_AGE", 60 * 60 * 24 * 31 * 12 * 4);
    this.LOGIN_TIME = getEnv("number", "LOGIN_TIME", 2e3);
    this.USER_SALT = getEnv("string", "USER_SALT", "");
    this.RNG_PREC = getEnv("number", "RNG_PREC", 3);
    this.ANSWER_PREC = getEnv("number", "ANSWER_PREC", 0.01);
    this.DECIMAL_POINT = getEnv("boolean", "DECIMAL_POINT", true);
    const VERBOSITY = getEnv("number", "VERBOSITY", 3);

    if (!isCorrectVerbosity(VERBOSITY)) {
      throw new Error("VERBOSITY must be integer from 0 to 4.");
    }

    this.VERBOSITY = VERBOSITY;
    let fresh = Deno.env.get("FRESH");
    const safeWord =
      "With great power comes great responsibility. Yes, do as I say!";
    this.FRESH = fresh === safeWord;
    if (this.VERBOSITY >= 2) {
      if (fresh !== undefined) {
        console.warn(
          `The FRESH is present. Set its value to "${safeWord}" to delete all collections.`
        );
      }
      fresh = this.FRESH ? "" : " NOT";
      console.warn(`The FRESH safe word was${fresh} triggered...`);
    }
    this.EXERCISES_PATH = getEnv("string", "EXERCISES_PATH", "./exercises/");
  }
}
