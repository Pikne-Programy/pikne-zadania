// Copyright 2021 Michał Szymocha  <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assertEquals, test, TestSuite } from "../test_deps.ts";
import { deepCopy } from "../utils/mod.ts";
import { roleSuite } from "./role.ts";

const hierarchySuite = new TestSuite({
  name: "hierarchy",
  suite: roleSuite,
});

// TODO: make tests where done != null

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

test(
  hierarchySuite,
  "Root - get hierarchy, public subject, raw = false",
  async (context) => {
    const response = await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.root)
      .send({ subject: "fizyka", raw: false })
      .expect(200);
    assertEquals(
      response.body[1]?.children[0]?.children[0]?.description,
      description,
    );
  },
);

test(
  hierarchySuite,
  "Root - get hierarchy, public subject, raw = true",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.root)
      .send({ subject: "fizyka", raw: true })
      .expect(200)
      .expect(whole(hierarchy));
  },
);

test(
  hierarchySuite,
  "Teacher - get hierarchy, public subject, raw = false",
  async (context) => {
    const response = await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.teacher)
      .send({ subject: "fizyka", raw: false })
      .expect(200);
    const desc = response.body[1]?.children[0]?.children[0]?.description;
    assertEquals(desc, description);
  },
);

test(
  hierarchySuite,
  "Teacher - get hierarchy, public subject, raw = true",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.root)
      .send({ subject: "fizyka", raw: true })
      .expect(200)
      .expect(whole(hierarchy));
  },
);

test(
  hierarchySuite,
  "Student - get hierarchy, public subject, raw = false",
  async (context) => {
    const response = await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.student)
      .send({ subject: "fizyka", raw: false })
      .expect(200);
    const desc = response.body[0]?.children[0]?.children[0]?.description;
    assertEquals(desc, description);
  },
);

test(
  hierarchySuite,
  "Student - get hierarchy, public subject, raw = true",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.student)
      .send({ subject: "fizyka", raw: true })
      .expect(200)
      .expect(hierarchy);
  },
);

test(
  hierarchySuite,
  "Not logged in - get hierarchy, public subject, raw = false",
  async (context) => {
    const response = await (await context.request())
      .post("/api/subject/hierarchy/get")
      .send({ subject: "fizyka", raw: false })
      .expect(200);
    const desc = response.body[0]?.children[0]?.children[0]?.description;
    assertEquals(desc, description);
  },
);

test(
  hierarchySuite,
  "Not logged in - get hierarchy, public subject, raw = true",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/get")
      .send({ subject: "fizyka", raw: true })
      .expect(200)
      .expect(hierarchy);
  },
);

test(
  hierarchySuite,
  "Root - set hierarchy, public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/set")
      .set("Cookie", context.roles.root)
      .send({ subject: "fizyka", hierarchy: setHierarchy })
      .expect(200);
    const response = await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.root)
      .send({ subject: "fizyka", raw: true })
      .expect(200);
    assertEquals(
      response.body,
      whole(setHierarchy),
      "Hierarchy not changed",
    );
  },
);

test(
  hierarchySuite,
  "Assignee - set hierarchy, public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/set")
      .set("Cookie", context.roles.teacher)
      .send({ subject: "fizyka", hierarchy: setHierarchy2 })
      .expect(200);
    const response = await (await context.request())
      .post("/api/subject/hierarchy/get")
      .set("Cookie", context.roles.teacher)
      .send({ subject: "fizyka", raw: true })
      .expect(200);
    assertEquals(
      response.body,
      whole(setHierarchy2),
      "Hierarchy not changed",
    );
  },
);

test(
  hierarchySuite,
  "Student - try to set hierarchy, public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/set")
      .set("Cookie", context.roles.student)
      .send({ subject: "fizyka", hierarchy: setHierarchy2 })
      .expect(403);
  },
);

test(
  hierarchySuite,
  "Not logged in - try to set hierarchy, public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/hierarchy/set")
      .send({ subject: "fizyka", hierarchy: setHierarchy })
      .expect(401);
  },
);
