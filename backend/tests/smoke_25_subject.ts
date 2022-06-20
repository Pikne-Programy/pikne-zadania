// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// TODO: add bad requests
import { basename } from "../deps.ts";
import { assert, assertEquals } from "../test_deps.ts";
import {
  endpointFactory,
  registerRoleTest,
  RoleTestContext,
} from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";
import { FailFastManager } from "./utils/fail-fast.ts";

interface DataEndpoint {
  ":/api/subject/list": undefined;
  "/api/subject/create": { subject: string; assignees: string[] | null };
  "/api/subject/info": { subject: string };
  "/api/subject/permit": { subject: string; assignees: string[] | null };
}

export async function initSubjectTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  const ffm = new FailFastManager(t, undefined);

  await ffm.test("Make _easy visible for root only", async () => {
    await endpoint(
      "root",
      "/api/subject/permit",
      { subject: "_easy", assignees: [] },
      200,
    );
    await endpoint(
      "root",
      "/api/subject/info",
      { subject: "_easy" },
      [200, { assignees: [] }],
    );
  }, true);

  await ffm.test("Student - list (only public subjects)", async () => {
    const response = await endpoint(
      "bob",
      ":/api/subject/list",
      undefined,
      200,
    );
    assert(
      "subjects" in response && Array.isArray(response.subjects),
    );
    response.subjects.sort();
    assertEquals(response.subjects, ["easy", "fizyka"]);
  });

  await ffm.test("Teacher - list (only public subjects)", async () => {
    const response = await endpoint(
      "ralph",
      ":/api/subject/list",
      undefined,
      200,
    );
    assert(
      "subjects" in response && Array.isArray(response.subjects),
    );
    response.subjects.sort();
    assertEquals(response.subjects, ["easy", "fizyka"]);
  });

  await ffm.test("Not logged in - list", async () => {
    const response = await endpoint(
      "eve",
      ":/api/subject/list",
      undefined,
      200,
    );
    assert(
      "subjects" in response && Array.isArray(response.subjects),
    );
    response.subjects.sort();
    assertEquals(response.subjects, ["easy", "fizyka"]);
  });

  await ffm.test("Root - create a public subject", async () => {
    await endpoint(
      "root",
      "/api/subject/create",
      {
        subject: "astronomia",
        assignees: [data.u.lanny.id],
      },
      200,
    );
    await endpoint(
      "root",
      "/api/subject/info",
      {
        subject: "astronomia",
      },
      [200, {
        assignees: [{ userId: data.u.lanny.id, name: data.u.lanny.name }],
      }],
    );
  }, true);

  await ffm.test("Teacher - create public subject", async () => {
    await endpoint(
      "lanny",
      "/api/subject/create",
      { subject: "informatyka", assignees: null },
      200,
    );
    await endpoint(
      "root",
      "/api/subject/info",
      {
        subject: "informatyka",
      },
      [200, { assignees: null }],
    );
  }, true);

  await ffm.test("Student - try to create a subject", async () => {
    await endpoint(
      "alice",
      "/api/subject/create",
      { subject: "fizyka2", assignees: null },
      403,
    );
  }, true);

  await ffm.test("Not logged in - try to create a subject", async () => {
    await endpoint(
      "eve",
      "/api/subject/create",
      { subject: "fizyka2", assignees: null },
      401,
    );
  }, true);

  await ffm.test(
    "Admin - try to create a subject (name already taken)",
    async () => {
      await endpoint(
        "root",
        "/api/subject/create",
        { subject: "fizyka", assignees: null },
        409,
      );
    },
    true,
  );

  await ffm.test("Admin - create a subject with no assignees", async () => {
    await endpoint(
      "root",
      "/api/subject/create",
      { subject: "fizyka2", assignees: [] },
      200,
    );
    await endpoint(
      "root",
      "/api/subject/info",
      { subject: "fizyka2" },
      [200, { assignees: [] }],
    );
  }, true);

  await ffm.test("Student - try to get info about public subject", async () => {
    await endpoint(
      "alice",
      "/api/subject/info",
      { subject: "fizyka" },
      403,
    );
  });

  await ffm.test("Assignee - get info about public subject", async () => {
    await endpoint(
      "ralph",
      "/api/subject/info",
      { subject: "fizyka" },
      [200, { "assignees": null }],
    );
  });

  await ffm.test("Root - get info about public subject", async () => {
    await endpoint(
      "root",
      "/api/subject/info",
      { subject: "fizyka" },
      [200, { "assignees": null }],
    );
  });

  await ffm.test("Not logged in - try to get info about public subject", async () => {
    await endpoint(
      "eve",
      "/api/subject/info",
      { subject: "fizyka" },
      401,
    );
  });

  await ffm.test("Admin - permit public subject", async () => {
    await endpoint(
      "root",
      "/api/subject/permit",
      { subject: "fizyka", assignees: [data.u.lanny.id] },
      200,
    );
    await endpoint(
      "root",
      "/api/subject/info",
      { subject: "fizyka" },
      [200, {
        assignees: [{ userId: data.u.lanny.id, name: data.u.lanny.name }],
      }],
    );
  }, true);

  await ffm.test("Assignee - permit public subject", async () => {
    await endpoint(
      "lanny",
      "/api/subject/permit",
      { subject: "fizyka", assignees: [] },
      200,
    );
    await endpoint(
      "root",
      "/api/subject/info",
      { subject: "fizyka" },
      [200, { assignees: [] }],
    );
  }, true);

  await ffm.test("Teacher - try to permit public subject", async () => {
    await endpoint(
      "ralph",
      "/api/subject/permit",
      { subject: "fizyka", assignees: null },
      403,
    );
  }, true);

  await ffm.test("Student - try to permit public subject", async () => {
    await endpoint(
      "alice",
      "/api/subject/permit",
      { subject: "fizyka", assignees: null },
      403,
    );
  }, true);

  await ffm.test("Not logged in - try to permit public subject", async () => {
    await endpoint(
      "eve",
      "/api/subject/permit",
      { subject: "fizyka", assignees: null },
      401,
    );
  }, true);

  await ffm.test("Make _easy available for all assignees", async () => {
    await endpoint(
      "root",
      "/api/subject/permit",
      { subject: "_easy", assignees: null },
      200,
    );
    await endpoint(
      "lanny",
      "/api/subject/info",
      { subject: "_easy" },
      [200, { assignees: null }],
    );
  }, true);

  return ffm.ignore;
}

registerRoleTest(basename(import.meta.url), initSubjectTests);
