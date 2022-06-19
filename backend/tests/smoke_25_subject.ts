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

interface DataEndpoint {
  ":/api/subject/list": undefined;
  "/api/subject/create": { subject: string; assignees: string[] | null };
  "/api/subject/info": { subject: string };
  "/api/subject/permit": { subject: string; assignees: string[] | null };
}

export async function initSubjectTests(
  t: Deno.TestContext,
  g: RoleTestContext,
  ff: boolean,
) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  let ignore = false;

  ignore ||= !await t.step({
    ignore,
    name: "Make _easy visible for root only",
    fn: async () => {
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
    },
  }) && ff;

  await t.step({
    ignore,
    name: "Student - list (only public subjects)",
    fn: async () => {
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
    },
  });

  await t.step({
    ignore,
    name: "Teacher - list (only public subjects)",
    fn: async () => {
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
    },
  });

  await t.step({
    ignore,
    name: "Not logged in - list",
    fn: async () => {
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
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "Root - create a public subject",
    fn: async () => {
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
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Teacher - create public subject",
    fn: async () => {
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
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Student - try to create a subject",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/subject/create",
        { subject: "fizyka2", assignees: null },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Not logged in - try to create a subject",
    fn: async () => {
      await endpoint(
        "eve",
        "/api/subject/create",
        { subject: "fizyka2", assignees: null },
        401,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Admin - try to create a subject (name already taken)",
    fn: async () => {
      await endpoint(
        "root",
        "/api/subject/create",
        { subject: "fizyka", assignees: null },
        409,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Admin - create a subject with no assignees",
    fn: async () => {
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
    },
  }) && ff;

  await t.step({
    ignore,
    name: "Student - try to get info about public subject",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/subject/info",
        { subject: "fizyka" },
        403,
      );
    },
  });

  await t.step({
    ignore,
    name: "Assignee - get info about public subject",
    fn: async () => {
      await endpoint(
        "ralph",
        "/api/subject/info",
        { subject: "fizyka" },
        [200, { "assignees": null }],
      );
    },
  });

  await t.step({
    ignore,
    name: "Root - get info about public subject",
    fn: async () => {
      await endpoint(
        "root",
        "/api/subject/info",
        { subject: "fizyka" },
        [200, { "assignees": null }],
      );
    },
  });

  await t.step({
    ignore,
    name: "Not logged in - try to get info about public subject",
    fn: async () => {
      await endpoint(
        "eve",
        "/api/subject/info",
        { subject: "fizyka" },
        401,
      );
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "Admin - permit public subject",
    fn: async () => {
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
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Assignee - permit public subject",
    fn: async () => {
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
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Teacher - try to permit public subject",
    fn: async () => {
      await endpoint(
        "ralph",
        "/api/subject/permit",
        { subject: "fizyka", assignees: null },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Student - try to permit public subject",
    fn: async () => {
      await endpoint(
        "alice",
        "/api/subject/permit",
        { subject: "fizyka", assignees: null },
        403,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Not logged in - try to permit public subject",
    fn: async () => {
      await endpoint(
        "eve",
        "/api/subject/permit",
        { subject: "fizyka", assignees: null },
        401,
      );
    },
  }) && ff;

  ignore ||= !await t.step({
    ignore,
    name: "Make _easy available for all assignees",
    fn: async () => {
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
    },
  }) && ff;

  return ignore;
}

registerRoleTest(basename(import.meta.url), initSubjectTests);
