// Copyright 2021 Michał Szymocha  <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assertEquals } from "../test_deps.ts";
import { deepCopy } from "../utils/mod.ts";
import { RoleTestContext } from "./smoke_mod.ts";

// TODO: make tests where done != null

export async function initHierarchyTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
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
  const unlisted = {
    name: "",
    children: [],
  };
  const whole = (hierarchy: unknown[]) => [unlisted, ...hierarchy];

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

  await t.step(
    "Root - get hierarchy, public subject, raw = false",
    async () => {
      const response = await (await g.request())
        .post("/api/subject/hierarchy/get")
        .set("Cookie", g.roles.root)
        .send({ subject: "fizyka", raw: false })
        .expect(200);
      assertEquals(
        response.body[1]?.children[0]?.children[0]?.description,
        description,
      );
    },
  );

  await t.step("Root - get hierarchy, public subject, raw = true", async () => {
    await (await g.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", g.roles.root)
      .send({ subject: "fizyka", raw: true })
      .expect(200)
      .expect(whole(hierarchy));
  });

  await t.step(
    "Teacher - get hierarchy, public subject, raw = false",
    async () => {
      const response = await (await g.request())
        .post("/api/subject/hierarchy/get")
        .set("Cookie", g.roles.teacher)
        .send({ subject: "fizyka", raw: false })
        .expect(200);
      const desc = response.body[1]?.children[0]?.children[0]?.description;
      assertEquals(desc, description);
    },
  );

  await t.step(
    "Teacher - get hierarchy, public subject, raw = true",
    async () => {
      await (await g.request())
        .post("/api/subject/hierarchy/get")
        .set("Cookie", g.roles.root)
        .send({ subject: "fizyka", raw: true })
        .expect(200)
        .expect(whole(hierarchy));
    },
  );

  await t.step(
    "Student - get hierarchy, public subject, raw = false",
    async () => {
      const response = await (await g.request())
        .post("/api/subject/hierarchy/get")
        .set("Cookie", g.roles.student)
        .send({ subject: "fizyka", raw: false })
        .expect(200);
      const desc = response.body[0]?.children[0]?.children[0]?.description;
      assertEquals(desc, description);
    },
  );

  await t.step(
    "Student - get hierarchy, public subject, raw = true",
    async () => {
      await (await g.request())
        .post("/api/subject/hierarchy/get")
        .set("Cookie", g.roles.student)
        .send({ subject: "fizyka", raw: true })
        .expect(200)
        .expect(hierarchy);
    },
  );

  await t.step(
    "Not logged in - get hierarchy, public subject, raw = false",
    async () => {
      const response = await (await g.request())
        .post("/api/subject/hierarchy/get")
        .send({ subject: "fizyka", raw: false })
        .expect(200);
      const desc = response.body[0]?.children[0]?.children[0]?.description;
      assertEquals(desc, description);
    },
  );

  await t.step(
    "Not logged in - get hierarchy, public subject, raw = true",
    async () => {
      await (await g.request())
        .post("/api/subject/hierarchy/get")
        .send({ subject: "fizyka", raw: true })
        .expect(200)
        .expect(hierarchy);
    },
  );

  await t.step("Root - set hierarchy, public subject", async () => {
    await (await g.request())
      .post("/api/subject/hierarchy/set")
      .set("Cookie", g.roles.root)
      .send({ subject: "fizyka", hierarchy: setHierarchy })
      .expect(200);
    const response = await (await g.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", g.roles.root)
      .send({ subject: "fizyka", raw: true })
      .expect(200);
    assertEquals(
      response.body,
      whole(setHierarchy),
      "Hierarchy not changed",
    );
  });

  await t.step("Assignee - set hierarchy, public subject", async () => {
    await (await g.request())
      .post("/api/subject/hierarchy/set")
      .set("Cookie", g.roles.teacher)
      .send({ subject: "fizyka", hierarchy: setHierarchy2 })
      .expect(200);
    const response = await (await g.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", g.roles.teacher)
      .send({ subject: "fizyka", raw: true })
      .expect(200);
    assertEquals(
      response.body,
      whole(setHierarchy2),
      "Hierarchy not changed",
    );
  });

  await t.step("Student - try to set hierarchy, public subject", async () => {
    await (await g.request())
      .post("/api/subject/hierarchy/set")
      .set("Cookie", g.roles.student)
      .send({ subject: "fizyka", hierarchy: setHierarchy2 })
      .expect(403);
  });

  await t.step(
    "Not logged in - try to set hierarchy, public subject",
    async () => {
      await (await g.request())
        .post("/api/subject/hierarchy/set")
        .send({ subject: "fizyka", hierarchy: setHierarchy })
        .expect(401);
    },
  );
}
