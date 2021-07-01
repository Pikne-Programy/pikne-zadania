// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { vs } from "../deps.ts";

export const userSchema = {
  id: vs.string({ pattern: /^[A-Fa-f0-9]{64}$/ }),
  login: vs.string(), // "admin"|"root"|email?
  name: vs.string({ maxLength: 20, ifUndefined: null }),
  nameReq: vs.string({ maxLength: 20 }),
  hpassword: vs.string({ minLength: 44, maxLength: 44 }),
  seed: vs.number({ integer: true }),
  number: vs.number({
    strictType: true,
    ifNull: null,
    ifUndefined: NaN,
    integer: true,
    minValue: 1,
    maxValue: 1e4,
  }),
};
export const teamSchema = {
  id: vs.number({ strictType: true, integer: true, minValue: 1 }),
  name: vs.string({ minLength: 1, maxLength: 40, ifUndefined: null }),
  nameReq: vs.string({ minLength: 1, maxLength: 40 }),
  assignee: vs.string({ pattern: /^[A-Fa-f0-9]{64}$/, ifUndefined: null }),
  users: vs.array({
    each: {
      schema: vs.object({
        schemaObject: {
          id: vs.string({ pattern: /^[A-Fa-f0-9]{64}$/ }),
          name: vs.string({ maxLength: 40 }),
        },
      }),
      ignoresErrors: false,
    },
  }),
  invitation: vs.string({
    maxLength: 40,
    ifUndefined: null,
    ifNull: "null",
    ifEmptyString: "",
  }),
};
export const subjectSchema = {
  id: vs.string({ strictType: true, minLength: 1, maxLength: 40 }),
  users: vs.array({
    each: {
      schema: vs.object({
        schemaObject: {
          id: vs.string({ pattern: /^[A-Fa-f0-9]{64}$/ }),
          name: vs.string({ maxLength: 40 }),
        },
      }),
      ignoresErrors: false,
    },
  }),
  invitation: vs.string({ minLength: 1, maxLength: 40 }),
};
export const exerciseSchema = {
  id: vs.string({ minLength: 1, maxLength: 40 }),
  content: vs.string({ minLength: 1 }),
  answers: vs.array({
    each: {
      schema: vs.number(),
      ignoresErrors: false,
    },
  }),
  seed: vs.number({ ifUndefined: 0, strictType: true, integer: true }),
};
