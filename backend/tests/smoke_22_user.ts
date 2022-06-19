// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { basename } from "../deps.ts";
import {
  endpointFactory,
  registerRoleTest,
  RoleTestContext,
} from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";
import { login, register } from "./utils/user.ts";

interface DataEndpoint {
  "/api/auth/register": {
    login: string;
    name: string;
    hashedPassword: string;
    number: number;
    invitation: string;
  };
  "/api/user/info": { userId?: string };
  "/api/user/update": { userId: string; number?: number | null; name?: string };
  "/api/user/delete": { userId: string };
}

export async function initUserTests(
  t: Deno.TestContext,
  g: RoleTestContext,
  ff: boolean,
) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  let ignore = false;

  await t.step({
    ignore,
    name: "root exists",
    fn: async () => {
      await endpoint(
        "root",
        "/api/user/info",
        {},
        [200, { name: data.u.root.name, teamId: 0, number: null }],
      );
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "Create another user",
    fn: async () => {
      await endpoint(
        "eve",
        "/api/auth/register",
        {
          login: "user2@example.com",
          name: "User2",
          hashedPassword: data.u.alice.hashedPassword,
          number: 11,
          invitation: data.u.alice.invitation,
        },
        200,
      );
    },
  }) && ff;

  await t.step({
    ignore,
    name: "Teacher - get info about student",
    fn: async () => {
      await endpoint(
        "lanny",
        "/api/user/info",
        { userId: data.u.alice.id },
        [200, {
          name: data.u.alice.name,
          teamId: 2,
          number: data.number(data.u.alice),
        }],
      );
    },
  });

  await t.step({
    ignore,
    name: "Get info about currently authenticated student",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/user/info",
        {},
        [200, {
          name: data.u.alice.name,
          teamId: 2,
          number: data.number(data.u.alice),
        }],
      );
    },
  });

  await t.step({
    ignore,
    name: "Student - get info about another student",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/user/info",
        { userId: data.u.bob.id },
        403,
      );
    },
  });

  await t.step({
    ignore,
    name: "Student - get info about teacher",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/user/info",
        { userId: data.u.lanny.id },
        403,
      );
    },
  });

  await t.step({
    ignore,
    name: "Student - get info about admin",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/user/info",
        { userId: data.u.root.id },
        403,
      );
    },
  });

  await t.step({
    ignore,
    name: "Not logged in - get info about student",
    fn: async () => {
      await endpoint(
        "eve",
        "/api/user/info",
        { userId: data.u.alice.id },
        401,
      );
    },
  });

  await t.step({
    ignore,
    name: "Not logged in - get info",
    fn: async () => {
      await endpoint(
        "eve",
        "/api/user/info",
        {},
        401,
      );
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "Root - update student's name and number",
    fn: async () => {
      await endpoint(
        "root",
        "/api/user/update",
        { userId: data.u.alice.id, name: "Student", number: 11 },
        200,
      );
      await endpoint(
        "alice",
        "/api/user/info",
        {},
        [200, { name: "Student", teamId: 2, number: 11 }],
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Assignee - update student's name and number",
    fn: async () => {
      await endpoint(
        "lanny",
        "/api/user/update",
        {
          userId: data.u.alice.id,
          name: data.u.alice.name,
          number: data.number(data.u.alice),
        },
        200,
      );
      await endpoint(
        "alice",
        "/api/user/info",
        {},
        [200, {
          name: data.u.alice.name,
          teamId: 2,
          number: data.number(data.u.alice),
        }],
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Teacher - update student's name and number",
    fn: async () => {
      await endpoint(
        "ralph",
        "/api/user/update",
        { userId: data.u.alice.id, name: "User", number: 1 },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Teacher - update admin's name",
    fn: async () => {
      await endpoint(
        "lanny",
        "/api/user/update",
        { userId: data.u.root.id, name: "rooot" },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Student - update another student's name",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/user/update",
        { userId: data.u.bob.id, name: "User2" },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Student - try to delete a student",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/user/delete",
        { userId: data.u.bob.id },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Teacher - try to delete a student",
    fn: async () => {
      await endpoint(
        "ralph",
        "/api/user/delete",
        { userId: data.u.bob.id },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Not logged in - try to delete a student",
    fn: async () => {
      await endpoint(
        "eve",
        "/api/user/delete",
        { userId: data.u.bob.id },
        401,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Assignee - delete a student",
    fn: async () => {
      await endpoint(
        "lanny",
        "/api/user/delete",
        { userId: data.u.bob.id },
        200,
      );
      await endpoint(
        "root",
        "/api/user/info",
        { userId: data.u.bob.id },
        404,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Admin - try to update a non-existing student",
    fn: async () => {
      await endpoint(
        "root",
        "/api/user/update",
        { userId: data.u.bob.id, name: data.dummy.u.name },
        404,
      );
      await register(g, data.u.bob);
      g.roles.bob = await login(g, data.u.bob);
    },
  }) && ff;

  return ignore;
}

registerRoleTest(basename(import.meta.url), initUserTests);
