// Copyright 2021 Michał Szymocha  <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { basename } from "../deps.ts";
import { Section } from "../types/mod.ts";
import { deepCopy } from "../utils/mod.ts";
import { assertEquals } from "../test_deps.ts";
import {
  endpointFactory,
  registerRoleTest,
  RoleTestContext,
} from "./smoke_mod.ts";
import { FailFastManager } from "./utils/fail-fast.ts";

// TODO: make tests where done != null
// TODO: make tests with unlisted exercises

interface DataEndpoint {
  "/api/subject/hierarchy/get": { subject: string; raw: boolean };
  "/api/subject/hierarchy/set": { subject: string; hierarchy: Section[] };
}

export async function initHierarchyTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  const ffm = new FailFastManager(t, undefined);

  const description =
    "Z miast \\(A\\) i \\(B\\) odległych o \\(d= 300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_{a}= \\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_{b}= \\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?\n";

  const hierarchy = [
    {
      name: "mechanika",
      children: [
        {
          name: "kinematyka",
          children: [
            {
              name: "Pociągi dwa",
              children: "pociagi-dwa",
            },
            {
              name: "Pociągi dwa 2",
              children: "pociagi-dwa-2",
            },
          ],
        },
      ],
    },
  ];

  const setHierarchy = [
    {
      name: "mechanika",
      children: [
        {
          name: "kinematyka",
          children: [
            {
              name: "Pociągi dwa",
              children: "pociagi-dwa",
            },
            {
              name: "Pociągi dwa 2",
              children: "pociagi-dwa-2",
            },
          ],
        },
      ],
    },
  ];
  const setHierarchy2 = deepCopy(setHierarchy);
  setHierarchy2[0].children[0].children.reverse();

  await ffm.test("Root - get hierarchy, public subject, raw = false", async () => {
    const response = await endpoint(
      "root",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: false },
      200,
    );
    assertEquals(
      response[1]?.children[0]?.children[0]?.description,
      description,
    );
  });

  await ffm.test("Root - get hierarchy, public subject, raw = true", async () => {
    await endpoint(
      "root",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: true },
      [200, hierarchy],
    );
  });

  await ffm.test("Teacher - get hierarchy, public subject, raw = false", async () => {
    const response = await endpoint(
      "lanny",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: false },
      200,
    );
    const desc = response[1]?.children[0]?.children[0]?.description;
    assertEquals(desc, description);
  });

  await ffm.test("Teacher - get hierarchy, public subject, raw = true", async () => {
    await endpoint(
      "root",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: true },
      [200, hierarchy],
    );
  });

  await ffm.test("Student - get hierarchy, public subject, raw = false", async () => {
    const response = await endpoint(
      "alice",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: false },
      200,
    );
    const desc = response[0]?.children[0]?.children[0]?.description;
    assertEquals(desc, description);
  });

  await ffm.test("Student - get hierarchy, public subject, raw = true", async () => {
    await endpoint(
      "alice",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: true },
      [200, hierarchy],
    );
  });

  await ffm.test("Not logged in - get hierarchy, public subject, raw = false", async () => {
    const response = await endpoint(
      "eve",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: false },
      200,
    );
    const desc = response[0]?.children[0]?.children[0]?.description;
    assertEquals(desc, description);
  });

  await ffm.test("Not logged in - get hierarchy, public subject, raw = true", async () => {
    await endpoint(
      "eve",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: true },
      [200, hierarchy],
    );
  });

  await ffm.test("Root - set hierarchy, public subject", async () => {
    await endpoint(
      "root",
      "/api/subject/hierarchy/set",
      { subject: "fizyka", hierarchy: setHierarchy },
      200,
    );
    const response = await endpoint(
      "root",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: true },
      200,
    );
    assertEquals(response, setHierarchy, "Hierarchy not changed");
  }, true);

  await ffm.test("Assignee - set hierarchy, public subject", async () => {
    await endpoint(
      "lanny",
      "/api/subject/hierarchy/set",
      { subject: "fizyka", hierarchy: setHierarchy2 },
      200,
    );
    const response = await endpoint(
      "lanny",
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: true },
      200,
    );
    assertEquals(response, setHierarchy2, "Hierarchy not changed");
  }, true);

  await ffm.test("Student - try to set hierarchy, public subject", async () => {
    await endpoint(
      "alice",
      "/api/subject/hierarchy/set",
      { subject: "fizyka", hierarchy: setHierarchy2 },
      403,
    );
  }, true);

  await ffm.test(
    "Not logged in - try to set hierarchy, public subject",
    async () => {
      await endpoint(
        "eve",
        "/api/subject/hierarchy/set",
        { subject: "fizyka", hierarchy: setHierarchy },
        401,
      );
    },
    true,
  );

  return ffm.ignore;
}

registerRoleTest(basename(import.meta.url), initHierarchyTests);
