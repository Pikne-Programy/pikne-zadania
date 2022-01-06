// deno-lint-ignore no-control-regex
const notControlRegex = /^[^\u0000-\u001f]*$/;

export const reservedTeamInvitation = "\u0011";

export const comb = (...args: ({ source: string } | string)[]) =>
  new RegExp(
    `^${
      args.reduce<string>(
        (l, e) =>
          l +
          (typeof e === "string" ? e : e.source)
            .replace(/^\^/, "")
            .replace(/(?<!\\)\$$/, ""),
        "",
      )
    }$`,
  );

/** src: http://trac.webkit.org/browser/trunk/Source/WebCore/html/EmailInputType.cpp?rev=86298 \
 * The part of the WebKit project. \
 * Copyright (C) 2009 Michelangelo De Simone <micdesim@gmail.com> \
 * Copyright (C) 2010 Google Inc. All rights reserved.
 */
export const emailRegex =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/;

export const kebabCase = /^[a-z-0-9]+$/;

/** src: https://stackoverflow.com/a/21151612/6732111 */
export const base64of256bitsRegex = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/;

export const userIdOptions = { strictType: true, pattern: /^[0-9a-f]{64}$/ };
export const userNameOptions = {
  strictType: true,
  pattern: notControlRegex,
  maxLength: "Wierzchosława Achmistrowicz-Wachmistrowicz".length + 3,
};
export const userSeedOptions = {
  strictType: true,
  integer: true,
  minValue: -0x80000000,
  maxValue: 0x7fffffff,
};
export const userNumberOptions = {
  strictType: true,
  integer: true,
  ifNull: NaN, // please update docs below
  minValue: 1,
  maxValue: 1e4,
};
export const teamNameOptions = {
  strictType: true,
  pattern: notControlRegex,
  maxLength: 42,
};
export const teamInvitationOptions = {
  strictType: true,
  pattern: notControlRegex,
  maxLength: 1e3,
};
