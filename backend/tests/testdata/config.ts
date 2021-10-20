// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../../interfaces/mod.ts";
import { sha256 } from "../../utils/mod.ts";

export const lazyDefaultConfig: IConfigService = {
  MONGO_CONF: {
    db: "pikne-zadania--tests",
    url: "mongodb://mongo:27017",
    time: 5e3,
  },
  SEED_AGE: 60 * 60 * 24 * 31 * 12 * 4,
  LOGIN_TIME: 2e3,
  USER_SALT: "",
  RNG_PREC: 3,
  ANSWER_PREC: .01,
  DECIMAL_POINT: true,
  VERBOSITY: 1,
  JWT_CONF: {
    exp: 7 * 24 * 60 * 60,
    header: { alg: "HS256", typ: "JWT" },
    key: "secret",
  },
  ROOT_CONF: {
    enable: true,
    dhPassword: "$2a$10$zR.KkcwBxhQxbNPL9HMuReq8GyIJoQNilzdFoA1JevLQ0.BgZoo72", // secret
  },
  FRESH: true,
  EXERCISES_PATH: await Deno.makeTempDir({
    prefix: "pikne-zadania-exercises-",
  }),
  hash(login: string) {
    return sha256(login, this.USER_SALT);
  },
};

export const data = {
  root: {
    id: "changed below",
    login: "root",
    name: "root",
    hashedPassword: "t3SDQPqrwJM6fmiQZ7w3cO7ZJTStKE+aZ5mLlckMuqE=", // secret
  },
  teacher: {
    id: "changed below",
    login: "teacher@example.com",
    name: "Smith",
    hashedPassword: "26n60IlkcRznpeBQa2pI6zKp7ymLSBqiWLZEIEC+uEk=", // teacher
    invitation: "QwErTy58",
  },
  teacher2: {
    id: "changed below",
    login: "teacher2@example.com",
    name: "Williams",
    hashedPassword: "26n60IlkcRznpeBQa2pI6zKp7ymLSBqiWLZEIEC+uEk=", // teacher
    invitation: "QwErTy58",
  },
  student: {
    id: "changed below",
    login: "student@example.com",
    name: "User",
    hashedPassword: "Hth8SbNz18M69i3AJK7LEENcZ+S8KYDs8MhrlSWAK7U=", // student
    invitation: "85yTrEwQ",
    number: 1,
  },
  student2: {
    id: "changed below",
    login: "student2@example.com",
    name: "User2",
    hashedPassword: "Hth8SbNz18M69i3AJK7LEENcZ+S8KYDs8MhrlSWAK7U=", // student
    invitation: "85yTrEwQ",
    number: 2,
  },
};
type roles = keyof typeof data;
for (const key in data) {
  data[key as roles].id = lazyDefaultConfig.hash(data[key as roles].login);
}