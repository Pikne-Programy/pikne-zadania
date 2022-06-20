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
import { FailFastManager } from "./utils/fail-fast.ts";

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

export async function initUserTests(t: Deno.TestContext, g: RoleTestContext) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  const ffm = new FailFastManager(t, undefined);

  await ffm.test("root exists", async () => {
    await endpoint(
      "root",
      "/api/user/info",
      {},
      [200, { name: data.u.root.name, teamId: 0, number: null }],
    );
  });

  await ffm.test("Create another user", async () => {
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
  }, true);

  await ffm.test("Teacher - get info about student", async () => {
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
  });

  await ffm.test("Get info about currently authenticated student", async () => {
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
  });

  await ffm.test("Student - get info about another student", async () => {
    await endpoint(
      "alice",
      "/api/user/info",
      { userId: data.u.bob.id },
      403,
    );
  });

  await ffm.test("Student - get info about teacher", async () => {
    await endpoint(
      "alice",
      "/api/user/info",
      { userId: data.u.lanny.id },
      403,
    );
  });

  await ffm.test("Student - get info about admin", async () => {
    await endpoint(
      "alice",
      "/api/user/info",
      { userId: data.u.root.id },
      403,
    );
  });

  await ffm.test("Not logged in - get info about student", async () => {
    await endpoint(
      "eve",
      "/api/user/info",
      { userId: data.u.alice.id },
      401,
    );
  });

  await ffm.test("Not logged in - get info", async () => {
    await endpoint(
      "eve",
      "/api/user/info",
      {},
      401,
    );
  });

  await ffm.test("Root - update student's name and number", async () => {
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
  }, true);

  await ffm.test("Assignee - update student's name and number", async () => {
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
  }, true);

  await ffm.test("Teacher - update student's name and number", async () => {
    await endpoint(
      "ralph",
      "/api/user/update",
      { userId: data.u.alice.id, name: "User", number: 1 },
      403,
    );
  }, true);

  await ffm.test("Teacher - update admin's name", async () => {
    await endpoint(
      "lanny",
      "/api/user/update",
      { userId: data.u.root.id, name: "rooot" },
      403,
    );
  }, true);

  await ffm.test("Student - update another student's name", async () => {
    await endpoint(
      "alice",
      "/api/user/update",
      { userId: data.u.bob.id, name: "User2" },
      403,
    );
  }, true);

  await ffm.test("Student - try to delete a student", async () => {
    await endpoint(
      "alice",
      "/api/user/delete",
      { userId: data.u.bob.id },
      403,
    );
  }, true);

  await ffm.test("Teacher - try to delete a student", async () => {
    await endpoint(
      "ralph",
      "/api/user/delete",
      { userId: data.u.bob.id },
      403,
    );
  }, true);

  await ffm.test("Not logged in - try to delete a student", async () => {
    await endpoint(
      "eve",
      "/api/user/delete",
      { userId: data.u.bob.id },
      401,
    );
  }, true);

  await ffm.test("Assignee - delete a student", async () => {
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
  }, true);

  await ffm.test("Admin - try to update a non-existing student", async () => {
    await endpoint(
      "root",
      "/api/user/update",
      { userId: data.u.bob.id, name: data.dummy.u.name },
      404,
    );
    await register(g, data.u.bob);
    g.roles.bob = await login(g, data.u.bob);
  }, true);

  return ffm.ignore;
}

registerRoleTest(basename(import.meta.url), initUserTests);
