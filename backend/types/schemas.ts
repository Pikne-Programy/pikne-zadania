// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { vs } from "../deps.ts";

export const userSchema = {
  id: vs.string({ pattern: /^[A-Fa-f0-9]{64}$/ }),
  login: vs.string(), // "admin"|"root"|email?
  name: vs.string({ maxLength: 20 }),
  hpassword: vs.string({ minLength: 44, maxLength: 44 }),
  number: vs.number({
    strictType: true,
    ifNull: null,
    integer: true,
    minValue: 1,
    maxValue: 1e4,
  }),
};
export const teamSchema = {
  id: vs.number({ strictType: true, integer: true, minValue: 1 }),
  name: vs.string({ maxLength: 40 }),
  invCode: vs.string(),
};
