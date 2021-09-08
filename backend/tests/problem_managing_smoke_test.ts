// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert, assertEquals, test, TestSuite } from "../test_deps.ts";
import { deepCopy } from "../utils/mod.ts";
import { roleSuite } from "./role.ts";
import { data } from "./testdata/config.ts";

const pmSuite = new TestSuite({
  name: "problem managing",
  suite: roleSuite,
});

const rendered = {
  "type": "EqEx",
  "name": "Pociągi dwa 2",
  "problem": {
    "main":
      "Z miast \\(A\\) i \\(B\\) odległych o \\(d= 300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_{a}= 40\\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_{b}= 60\\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?\n",
    "unknown": [["x", "\\;\\mathrm{km}"], ["t", "\\;\\mathrm{h}"]],
    "img": [],
  },
  "done": null,
  "correctAnswer": { "answers": [1, 1] },
};

const studentVer: Partial<typeof rendered> = deepCopy(rendered);
delete studentVer.correctAnswer;
test({
  suite: pmSuite,
  name: "Admin - render an exercise with seed",
  sanitizeOps: false,
  fn: async (context) => {
    const response = await (await context.request())
      .post("/api/subject/problem/get")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        seed: 0,
      })
      .expect(200);
    assertEquals(response?.body, rendered, "Rendering exercise failed");
  },
});

test(pmSuite, "Teacher - render an exercise with seed", async (context) => {
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.teacher)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      seed: 0,
    })
    .expect(200);
  assertEquals(response?.body, rendered, "Rendering exercise failed");
});

test(pmSuite, "Student - render an exercise", async (context) => {
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
    })
    .expect(200);
  assertEquals(response?.body, studentVer, "Rendering exercise failed");
});

test(pmSuite, "Student - check whether seed is working", async (context) => {
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa",
    })
    .expect(200);
  const response2 = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa",
    })
    .expect(200);
  assertEquals(
    response?.body,
    response2?.body,
    "Failed to render same content with same seed",
  );
});

test(pmSuite, "Not logged in - render an exercise", async (context) => {
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
    })
    .expect(200);
  assertEquals(response?.body, studentVer, "Rendering exercise failed");
});

test(pmSuite, "Admin - non-existing exercise", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.root)
    .send({
      subject: "matematyka",
      exerciseId: "pociagi-dwa-2",
      seed: 0,
    })
    .expect(404);
});

test(pmSuite, "Admin - submit a solution (50%)", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.root)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [1, 0],
      },
    })
    .expect(200)
    .expect({ info: [true, false] });
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.root)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      seed: 0,
    })
    .expect(200);
  assertEquals(response?.body?.done, 0.5, "Done not saved");
});

test(pmSuite, "Admin - submit a solution (100%)", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.root)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [1, 1],
      },
    })
    .expect(200)
    .expect({ info: [true, true] });
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.root)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      seed: 0,
    })
    .expect(200);
  assertEquals(response?.body?.done, 1, "Done not saved");
});

test(pmSuite, "Admin - submit a solution (lower than highscore)", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.root)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [1, 0],
      },
    })
    .expect(200)
    .expect({ info: [true, false] });
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.root)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      seed: 0,
    })
    .expect(200);
  assertEquals(response?.body?.done, 1, "Done not saved");
});


test(pmSuite, "Admin - submit non-existing exercise", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.root)
    .send({
      subject: "matematyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [123, 456],
      },
    })
    .expect(404);
});

test(pmSuite, "Student - submit a solution (0%)", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [-123, 18283239723897],
      },
    })
    .expect(200)
    .expect({ info: [false, false] });
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
    })
    .expect(200);
  assertEquals(response?.body?.done, 0, "Done not saved");
});

test(pmSuite, "Student - submit a solution (100%)", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [1, 1],
      },
    })
    .expect(200)
    .expect({ info: [true, true] });
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
    })
    .expect(200);
  assertEquals(response?.body?.done, 1, "Done not saved");
});

test(pmSuite, "Student - submit a solution (lower than highscore)", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [1, 18283239723897],
      },
    })
    .expect(200)
    .expect({ info: [true, false] });
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
    })
    .expect(200);
  assertEquals(response?.body?.done, 1, "Done not saved");
});

test(pmSuite, "Teacher - submit a solution (50%)", async (context) => {
  await (await context.request())
    .post("/api/subject/problem/update")
    .set("Cookie", context.roles.teacher)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
      answer: {
        answers: [1, 17],
      },
    })
    .expect(200)
    .expect({ info: [true, false] });
  const response = await (await context.request())
    .post("/api/subject/problem/get")
    .set("Cookie", context.roles.teacher)
    .send({
      subject: "fizyka",
      exerciseId: "pociagi-dwa-2",
    })
    .expect(200);
  assertEquals(response?.body?.done, 0.5, "Done not saved");
});
