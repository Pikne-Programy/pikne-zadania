// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Algorithm } from "../deps.ts";
import { get, sha256 } from "../utils/mod.ts";
import { IConfigService } from "../interfaces/mod.ts";

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

function isFrom0To4(x: number): x is 0 | 1 | 2 | 3 | 4 {
  return [0, 1, 2, 3, 4].includes(x);
}

export class ConfigService implements IConfigService {
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
  readonly REPORTS_PATH: string;

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

    this.ROOT_CONF = {
      enable: get("boolean", "ROOT_ENABLE", false),
      password: Deno.env.get("ROOT_PASS"),
      dhPassword: Deno.env.get("ROOT_DHPASS"),
    };

    this.SEED_AGE = get("number", "SEED_AGE", 60 * 60 * 24 * 31 * 12 * 4);
    this.LOGIN_TIME = get("number", "LOGIN_TIME", 2e3);
    this.USER_SALT = get("string", "USER_SALT", "");
    this.RNG_PREC = get("number", "RNG_PREC", 3);
    this.ANSWER_PREC = get("number", "ANSWER_PREC", .01);
    this.DECIMAL_POINT = get("boolean", "DECIMAL_POINT", true);
    const VERBOSITY = get("number", "VERBOSITY", 3);
    if (!isFrom0To4(VERBOSITY)) {
      throw new Error("VERBOSITY must be from 0 to 4.");
    }
    this.VERBOSITY = VERBOSITY;
    let fresh = Deno.env.get("FRESH");
    const safeWord =
      "With great power comes great responsibility. Yes, do as I say!";
    this.FRESH = fresh === safeWord;
    if (this.VERBOSITY >= 2) {
      if (fresh !== undefined) {
        console.warn(
          `The FRESH is present. Set its value to "${safeWord}" to delete all collections.`,
        );
      }
      fresh = this.FRESH ? "" : " NOT";
      console.warn(`The FRESH safe word was${fresh} triggered...`);
    }
    this.EXERCISES_PATH = get("string", "EXERCISES_PATH", "./exercises/");
    this.REPORTS_PATH = get("string", "REPORTS_PATH", "./reports/");
  }

  hash(login: string) {
    return sha256(login, this.USER_SALT);
  }
}
