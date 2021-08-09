// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { vs } from "../deps.ts";
import { isArrayOf, isSection, Section } from "./mod.ts";

function comb(...args: ({ source: string } | string)[]) {
  return new RegExp(`^${
    args.reduce<string>(
      (l, e) =>
        l +
        (typeof e === "string" ? e : e.source)
          .replace(/^\^/, "")
          .replace(/(?<!\\)\$$/, ""),
      "",
    )
  }$`);
}
if (!comb(/a|/).test("")) throw new Error("never"); // TODO: move to unit test
if (comb(/a|/, /b/).test("")) throw new Error("never"); // TODO: move to unit test

/** src: http://trac.webkit.org/browser/trunk/Source/WebCore/html/EmailInputType.cpp?rev=86298 \
 * The part of the WebKit project. \
 * Copyright (C) 2009 Michelangelo De Simone <micdesim@gmail.com> \
 * Copyright (C) 2010 Google Inc. All rights reserved.
 */
const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/;

const kebabCase = /^[a-z-0-9]+$/;

const sha256Regex = /^[0-9a-f]{64}$/;

/** src: https://stackoverflow.com/a/21151612/6732111 */
const base64of256bitsRegex = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/;

// deno-lint-ignore no-control-regex
const notControlRegex = /^[^\u0000-\u001f]*$/;

const longestSupportedName = "Wierzchosława Achmistrowicz-Wachmistrowicz";
const longestSupportedUserNameLength = longestSupportedName.length + 3;

const longestSupportedTeamNameLength = 42;

const userIdOptions = { strictType: true, pattern: sha256Regex };
const userNameOptions = {
  strictType: true,
  pattern: notControlRegex,
  maxLength: longestSupportedUserNameLength,
};
const userSeedOptions = {
  strictType: true,
  integer: true,
  minValue: -0x80000000,
  maxValue: 0x7fffffff,
};
const userNumberOptions = {
  strictType: true,
  integer: true,
  ifNull: NaN, // please update docs below
  minValue: 1,
  maxValue: 1e4,
};
const teamNameOptions = {
  strictType: true,
  pattern: notControlRegex,
  maxLength: longestSupportedTeamNameLength,
};
export const reservedTeamInvitation = "\u0011";
if (notControlRegex.test(reservedTeamInvitation)) throw new Error("never");
// TODO: move to unit test; should test vs.string.applySchema
// TODO: test ""
const teamInvitationOptions = {
  strictType: true,
  pattern: notControlRegex,
  ifNull: "", // please update docs below
  maxLength: 1e3,
};

export const schemas = {
  exercise: {
    subject: vs.string({ strictType: true, pattern: comb(/_?/, kebabCase) }),
    id: vs.string({ strictType: true, pattern: kebabCase }),
    uid: vs.string({
      strictType: true,
      pattern: comb(/_?/, kebabCase, /\//, kebabCase),
    }),
    hierarchy: vs.array<Section>({
      converter: (e: unknown[], f) => {
        if (!isArrayOf(isSection, e)) throw f();
        return e;
      },
    }),
    content: vs.string({ strictType: true }),
  },

  user: {
    id: vs.string(userIdOptions),
    /** `undefined` -> `null` */
    idOptional: vs.string({ ...userIdOptions, ifUndefined: null }),
    login: vs.string({ strictType: true, pattern: comb(emailRegex, /|root/) }),
    name: vs.string(userNameOptions),
    /** `undefined` -> `null` */
    nameOptional: vs.string({ ...userNameOptions, ifUndefined: null }),
    hashedPassword: vs.string({
      strictType: true,
      pattern: base64of256bitsRegex,
    }),
    seed: vs.number(userSeedOptions),
    /** `undefined` -> `null` */
    seedOptional: vs.number({ ...userSeedOptions, ifUndefined: null }),
    /** `null` -> `NaN` */
    number: vs.number(userNumberOptions),
    /** `null` -> `NaN`, `undefined` -> `null` */
    numberOptional: vs.string({ ...userNumberOptions, ifUndefined: null }),
  },

  team: {
    id: vs.number({ strictType: true, minValue: 1, integer: true }),
    name: vs.string(teamNameOptions),
    /** `undefined` -> `null` */
    nameOptional: vs.string({ ...teamNameOptions, ifUndefined: null }),
    /** `null` -> `""` */
    invitation: vs.string(teamInvitationOptions),
    /** `null` -> `""`, `undefined` -> `null` */
    ivitationOptional: vs.string({
      ...teamInvitationOptions,
      ifUndefined: null,
    }),
    /** `null` -> `""`, `undefined` -> `null`, `""` -> `"\u0011"` */
    ivitationGenerateOptional: vs.string({
      ...teamInvitationOptions,
      ifUndefined: null,
      ifEmptyString: reservedTeamInvitation,
    }),
  },
};
