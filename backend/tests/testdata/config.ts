// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService, IUserStore } from "../../interfaces/mod.ts";
import { assert } from "../../test_deps.ts";
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

type teams = "t" | "dd" | "d";
type users = "root" | "lanny" | "ralph" | "alice" | "bob" | "mike";

const teamData = {
  t: { id: 1, n: "Teachers", i: "teacher", a: "root", m: ["lanny", "ralph"] },
  dd: { id: 2, n: "3dd", i: "3dd", a: "lanny", m: ["alice", "bob"] },
  d: { id: 3, n: "3d", i: "e^iπ+1=0", a: "ralph", m: ["mike"] },
} as const;
const invs = Object.fromEntries(
  (Object.entries(teamData).map((e) => [e[1].i, e[1].id]) as [string, number][])
    .concat([["", 0]]),
);
const userData: {
  [prop in users]: Parameters<IUserStore["add"]>[1] & {
    id: string;
    hashedPassword: string;
    invitation: string;
  };
} = {
  root: {
    id: "changed below",
    login: "root",
    name: "root",
    hashedPassword: "t3SDQPqrwJM6fmiQZ7w3cO7ZJTStKE+aZ5mLlckMuqE=", // secret
    invitation: "",
  },
  /** teacher - assignee of Alice and Bob */
  lanny: {
    id: "changed below",
    login: "lanny@example.com",
    name: "Lanny",
    hashedPassword: "26n60IlkcRznpeBQa2pI6zKp7ymLSBqiWLZEIEC+uEk=", // teacher
    invitation: teamData.t.i,
  },
  /** teacher - assignee of Mike */
  ralph: {
    id: "changed below",
    login: "ralph@example.com",
    name: "Ralph",
    hashedPassword: "26n60IlkcRznpeBQa2pI6zKp7ymLSBqiWLZEIEC+uEk=", // teacher
    invitation: teamData.t.i,
  },
  alice: {
    id: "changed below",
    login: "alice@example.com",
    name: "Alice",
    hashedPassword: "Hth8SbNz18M69i3AJK7LEENcZ+S8KYDs8MhrlSWAK7U=", // student
    invitation: teamData.dd.i,
    number: 1,
  },
  bob: {
    id: "changed below",
    login: "bob@example.com",
    name: "Bob",
    hashedPassword: "Hth8SbNz18M69i3AJK7LEENcZ+S8KYDs8MhrlSWAK7U=", // student
    invitation: teamData.dd.i,
    number: 2,
  },
  mike: {
    id: "changed below",
    login: "mike@example.com",
    name: "Mike",
    hashedPassword: "Hth8SbNz18M69i3AJK7LEENcZ+S8KYDs8MhrlSWAK7U=", // student
    invitation: teamData.d.i,
    number: 1,
  },
};
let key: keyof typeof userData;
for (key in userData) {
  userData[key].id = lazyDefaultConfig.hash(userData[key].login);
}
const dummy = {
  t: {
    nextId: Math.max(...Object.values(teamData).map((e) => e.id)) + 1,
    id: 1024,
    name: "2d",
    nextName: "LEAVE ME HERE",
    inv: "xd",
    closingInv: null,
    randomInv: "",
  },
  u: {
    id: "changed below",
    login: "craig@example.com",
    hPass: userData.alice.hashedPassword,
    name: "Craig",
    number: 47,
  },
};
dummy.u.id = lazyDefaultConfig.hash(dummy.u.login);
assert(!(dummy.t.name in Object.values(teamData).map((e) => e.n)));
assert(!(dummy.t.inv in Object.values(teamData).map((e) => e.i)));
assert(!(dummy.u.id in Object.values(userData).map((e) => e.id)));
assert(!(dummy.u.login in Object.values(userData).map((e) => e.login)));
assert(!(dummy.u.name in Object.values(userData).map((e) => e.name)));
assert(!(dummy.u.number in Object.values(userData).map((e) => e.number)));

export const data = {
  t: teamData,
  u: userData,
  i: invs,
  number: (info: { number?: number | null }) =>
    "number" in info ? info.number : null,
  dummy,
};
