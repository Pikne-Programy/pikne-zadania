// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert, assertEquals } from "../test_deps.ts";
import { deepCopy } from "../utils/mod.ts";
import { endpointFactory, RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

interface DataEndpoint {
  "/api/subject/problem/render": {
    subject: string;
    exerciseId: string;
    seed?: number;
  };
  "/api/subject/problem/submit": {
    subject: string;
    exerciseId: string;
    answer: { answers: number[] };
  };
  "/api/subject/hierarchy/get": { subject: string; raw: boolean };
}

export async function initProblemTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
  const endpoint = endpointFactory<DataEndpoint>(g);

  const rendered = {
    "type": "EqEx",
    "name": "Pociągi dwa 2",
    "problem": {
      "main":
        "Z miast \\(A\\) i \\(B\\) odległych o \\(d= 300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_{a}= 40\\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_{b}= 60\\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?\n",
      "unknown": [["x", "\\;\\mathrm{km}"], ["t", "\\;\\mathrm{h}"]],
      "img": [],
    },
    "correctAnswer": { "answers": [1, 1] },
    "done": null,
  };

  const studentVer: Partial<typeof rendered> = deepCopy(rendered);
  delete studentVer.correctAnswer;

  async function getDone(
    user: keyof (typeof data)["u"],
    exerciseId: string,
  ): Promise<null | number> {
    const response = await endpoint(
      user,
      "/api/subject/problem/render",
      { subject: "fizyka", exerciseId },
      200,
    );
    const done1 = response?.done;
    const response2 = await endpoint(
      user,
      "/api/subject/hierarchy/get",
      { subject: "fizyka", raw: false },
      200,
    );
    type crazyType = { done?: null | number; children: string | crazyType[] };
    const recu = (o: crazyType[]): number | null | undefined =>
      o.reduce<null | number | undefined>((p, n) => {
        if (n?.children === exerciseId) return n?.done;
        if (!Array.isArray(n?.children)) return p;
        const r = recu(n.children);
        return r !== undefined ? r : p;
      }, undefined);
    const done2 = recu(response2);
    assert(
      done2 !== undefined,
      `exercise '${exerciseId}' not found in hierarchy`,
    );
    assertEquals(done1, done2, "`done` differs");
    return done1;
  }

  await t.step("Admin - render an exercise with seed", async () => {
    const response = await endpoint(
      "root",
      "/api/subject/problem/render",
      { subject: "fizyka", exerciseId: "pociagi-dwa-2", seed: 0 },
      200,
    );
    assertEquals(response, rendered, "Rendering exercise failed");
  });

  await t.step("Teacher - render an exercise with seed", async () => {
    const response = await endpoint(
      "lanny",
      "/api/subject/problem/render",
      { subject: "fizyka", exerciseId: "pociagi-dwa-2", seed: 0 },
      200,
    );
    assertEquals(response, rendered, "Rendering exercise failed");
  });

  await t.step("Student - render an exercise", async () => {
    const response = await endpoint(
      "alice",
      "/api/subject/problem/render",
      { subject: "fizyka", exerciseId: "pociagi-dwa-2" },
      200,
    );
    assertEquals(response, studentVer, "Rendering exercise failed");
  });

  await t.step("Student - check whether seed is working", async () => {
    const response = await endpoint(
      "alice",
      "/api/subject/problem/render",
      { subject: "fizyka", exerciseId: "pociagi-dwa" },
      200,
    );
    const response2 = await endpoint(
      "alice",
      "/api/subject/problem/render",
      { subject: "fizyka", exerciseId: "pociagi-dwa" },
      200,
    );
    assertEquals(
      response,
      response2,
      "Failed to render same content with same seed",
    );
  });

  await t.step("Not logged in - render an exercise", async () => {
    const response = await endpoint(
      "eve",
      "/api/subject/problem/render",
      { subject: "fizyka", exerciseId: "pociagi-dwa-2" },
      200,
    );
    assertEquals(response, studentVer, "Rendering exercise failed");
  });

  await t.step("Admin - non-existing exercise", async () => {
    await endpoint(
      "root",
      "/api/subject/problem/render",
      { subject: "matematyka", exerciseId: "pociagi-dwa-2", seed: 0 },
      404,
    );
  });
  await t.step("Admin - submit a solution (50%)", async () => {
    await endpoint(
      "root",
      "/api/subject/problem/submit",
      {
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 0],
        },
      },
      [200, { info: [true, false] }],
    );
  });

  await t.step("Admin - submit a solution (100%)", async () => {
    await endpoint(
      "root",
      "/api/subject/problem/submit",
      {
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 1],
        },
      },
      [200, { info: [true, true] }],
    );
  });

  await t.step("Admin - submit a solution (lower than highscore)", async () => {
    await endpoint(
      "root",
      "/api/subject/problem/submit",
      {
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 0],
        },
      },
      [200, { info: [true, false] }],
    );
  });

  await t.step("Admin - submit non-existing exercise", async () => {
    await endpoint(
      "root",
      "/api/subject/problem/submit",
      {
        subject: "matematyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [123, 456],
        },
      },
      404,
    );
  });

  await t.step("Student - submit a solution (0%)", async () => {
    await endpoint(
      "alice",
      "/api/subject/problem/submit",
      {
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [-123, 18283239723897],
        },
      },
      [200, { info: [false, false] }],
    );
    assertEquals(
      await getDone("alice", "pociagi-dwa-2"),
      0,
      "Done not saved",
    );
  });

  await t.step("Student - submit a solution (100%)", async () => {
    await endpoint(
      "alice",
      "/api/subject/problem/submit",
      {
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 1],
        },
      },
      [200, { info: [true, true] }],
    );
    assertEquals(
      await getDone("alice", "pociagi-dwa-2"),
      1,
      "Done not saved",
    );
  });

  await t.step(
    "Student - submit a solution (lower than highscore)",
    async () => {
      await endpoint(
        "alice",
        "/api/subject/problem/submit",
        {
          subject: "fizyka",
          exerciseId: "pociagi-dwa-2",
          answer: {
            answers: [1, 18283239723897],
          },
        },
        [200, { info: [true, false] }],
      );
      assertEquals(
        await getDone("alice", "pociagi-dwa-2"),
        0.5,
        "Done not saved",
      );
    },
  );

  await t.step("Teacher - submit a solution (50%)", async () => {
    await endpoint(
      "lanny",
      "/api/subject/problem/submit",
      {
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 17],
        },
      },
      [200, { info: [true, false] }],
    );
    assertEquals(
      await getDone("lanny", "pociagi-dwa-2"),
      0.5,
      "Done not saved",
    );
  });
}
