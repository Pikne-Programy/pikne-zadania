// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// deno-lint-ignore-file camelcase
import { vs } from "../deps.ts";

const USER = {
  // id:
  login: vs.string(), // "admin"|"root"|email?
  name: vs.string({ maxLength: 20 }),
  hpassword: vs.string({ minLength: 44, maxLength: 44 }),
  number: vs.number({ strictType: true, ifNull: null, integer: true, minValue: 1 }),
};
const TEAM = {
  id: vs.number({ strictType: true, integer: true, minValue: 1 }),
  name: vs.string({ maxLength: 40 }),
  invCode: vs.string(),
};
const register = {
  login: vs.email(),
  name: USER.name,
  hashed_password: USER.hpassword,
  number: USER.number,
  invitation: TEAM.invCode,
};
const login = {
  login: USER.login,
  hashed_password: USER.hpassword,
};
const addTeam = {
  name: TEAM.name,
};

export const userSchema = USER, teamSchema = TEAM;
export const endpointSchema = { register, login, addTeam };
