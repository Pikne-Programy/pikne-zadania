// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assertEquals } from "../test_deps.ts";
import { deepCopy } from "../utils/mod.ts";
import { RoleTestContext } from "./smoke_mod.ts";

export async function initProblemTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
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
  await t.step("Admin - render an exercise with seed", async () => {
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        seed: 0,
      })
      .expect(200);
    assertEquals(response?.body, rendered, "Rendering exercise failed");
  });

  await t.step("Teacher - render an exercise with seed", async () => {
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.teacher)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        seed: 0,
      })
      .expect(200);
    assertEquals(response?.body, rendered, "Rendering exercise failed");
  });

  await t.step("Student - render an exercise", async () => {
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.student)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
      })
      .expect(200);
    assertEquals(response?.body, studentVer, "Rendering exercise failed");
  });

  await t.step("Student - check whether seed is working", async () => {
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.student)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa",
      })
      .expect(200);
    const response2 = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.student)
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

  await t.step("Not logged in - render an exercise", async () => {
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
      })
      .expect(200);
    assertEquals(response?.body, studentVer, "Rendering exercise failed");
  });

  await t.step("Admin - non-existing exercise", async () => {
    await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.root)
      .send({
        subject: "matematyka",
        exerciseId: "pociagi-dwa-2",
        seed: 0,
      })
      .expect(404);
  });

  await t.step("Admin - submit a solution (50%)", async () => {
    await (await g.request())
      .post("/api/subject/problem/update")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 0],
        },
      })
      .expect(200)
      .expect({ info: [true, false] });
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        seed: 0,
      })
      .expect(200);
    assertEquals(response?.body?.done, 0.5, "Done not saved");
  });

  await t.step("Admin - submit a solution (100%)", async () => {
    await (await g.request())
      .post("/api/subject/problem/update")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 1],
        },
      })
      .expect(200)
      .expect({ info: [true, true] });
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        seed: 0,
      })
      .expect(200);
    assertEquals(response?.body?.done, 1, "Done not saved");
  });

  await t.step("Admin - submit a solution (lower than highscore)", async () => {
    await (await g.request())
      .post("/api/subject/problem/update")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 0],
        },
      })
      .expect(200)
      .expect({ info: [true, false] });
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        seed: 0,
      })
      .expect(200);
    assertEquals(response?.body?.done, 1, "Done not saved");
  });

  await t.step("Admin - submit non-existing exercise", async () => {
    await (await g.request())
      .post("/api/subject/problem/update")
      .set("Cookie", g.roles.root)
      .send({
        subject: "matematyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [123, 456],
        },
      })
      .expect(404);
  });

  await t.step("Student - submit a solution (0%)", async () => {
    await (await g.request())
      .post("/api/subject/problem/update")
      .set("Cookie", g.roles.student)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [-123, 18283239723897],
        },
      })
      .expect(200)
      .expect({ info: [false, false] });
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.student)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
      })
      .expect(200);
    assertEquals(response?.body?.done, 0, "Done not saved");
  });

  await t.step("Student - submit a solution (100%)", async () => {
    await (await g.request())
      .post("/api/subject/problem/update")
      .set("Cookie", g.roles.student)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 1],
        },
      })
      .expect(200)
      .expect({ info: [true, true] });
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.student)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
      })
      .expect(200);
    assertEquals(response?.body?.done, 1, "Done not saved");
  });

  await t.step(
    "Student - submit a solution (lower than highscore)",
    async () => {
      await (await g.request())
        .post("/api/subject/problem/update")
        .set("Cookie", g.roles.student)
        .send({
          subject: "fizyka",
          exerciseId: "pociagi-dwa-2",
          answer: {
            answers: [1, 18283239723897],
          },
        })
        .expect(200)
        .expect({ info: [true, false] });
      const response = await (await g.request())
        .post("/api/subject/problem/get")
        .set("Cookie", g.roles.student)
        .send({
          subject: "fizyka",
          exerciseId: "pociagi-dwa-2",
        })
        .expect(200);
      assertEquals(response?.body?.done, 1, "Done not saved");
    },
  );

  await t.step("Teacher - submit a solution (50%)", async () => {
    await (await g.request())
      .post("/api/subject/problem/update")
      .set("Cookie", g.roles.teacher)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 17],
        },
      })
      .expect(200)
      .expect({ info: [true, false] });
    const response = await (await g.request())
      .post("/api/subject/problem/get")
      .set("Cookie", g.roles.teacher)
      .send({
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
      })
      .expect(200);
    assertEquals(response?.body?.done, 0.5, "Done not saved");
  });
}
