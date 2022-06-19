// Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { basename } from "../deps.ts";
import { assert, assertEquals, assertNotEquals } from "../test_deps.ts";
import {
  endpointFactory,
  registerRoleTest,
  RoleTestContext,
} from "./smoke_mod.ts";
import { data, generateProblemAnswer } from "./testdata/config.ts";

interface DataEndpoint {
  "/api/session/status": { teamId: number };
  "/api/session/list": undefined; // TODO: make it GET
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
  "/api/session/add": { teamId: number; subject: string; exerciseId: string };
  "/api/session/delete": {
    teamId: number;
    subject: string;
    exerciseId: string;
  };
  "/api/session/end": { teamId: number };
  "/api/session/reset": { teamId: number };
}

function deuid(uid: string) {
  const match = uid.match(/^([^/]*)\/([^/]*)$/);
  assert(match !== null);
  return { subject: match[1], exerciseId: match[2] };
}

function unicode(x: number | null) {
  switch (x) {
    case null:
      return "☐";
    case 0:
      return "☒";
    case 1:
      return "☑";
    default:
      return "⚀";
  }
}

export async function initSessionTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  let ignore = false; // ignore ||= !

  type Teams = (typeof data)["t"];
  async function checkState<T extends Teams[keyof Teams]>(
    team: T,
    finished: boolean,
    exerciseList: string[],
    correctness: {
      [key in T["m"][number]]?: (number | null)[];
    },
  ) {
    const exercises = exerciseList.map((e) => deuid(e));
    function isDefinedPair<T>(
      what: [string, T | undefined],
    ): what is [string, T] {
      return what[1] !== undefined;
    }
    const report = Object.entries<(number | null)[] | undefined>(correctness)
      .filter(isDefinedPair).map(
        (e) => ({
          userId: data.u[e[0] as keyof (typeof data)["u"]].id,
          exercises: e[1].map(unicode),
        }),
      );
    let client: keyof (typeof data)["u"];
    for (client of ["root", team.a] as const) {
      await endpoint(
        client,
        "/api/session/status",
        { teamId: team.id },
        [200, { finished, exercises, report }],
      );
    }
    for (client in correctness) {
      const c = correctness[client as T["m"][number]];
      if (c === undefined) continue;
      const response: {
        subject: string;
        exerciseId: string;
        done: number | null;
      }[] = (await endpoint(client, "/api/session/list", undefined, 200));
      const responseObj = response.reduce<Record<string, number | null>>(
        (o, e) => ({ ...o, [`${e.subject}/${e.exerciseId}`]: e.done }),
        {},
      );
      assertEquals(response.length, exerciseList.length);
      assertEquals(response.length, c.length);
      for (const [i, e] of exerciseList.entries()) {
        assertEquals(responseObj[e], c[i]);
      }
    }
  }

  await t.step({
    ignore,
    name: "only those who vieved session are visible",
    fn: async () => { // {{005}}}
      await checkState(data.t.dd, false, [], {});
      await endpoint("alice", "/api/session/list", undefined, [200, []]);
      await checkState(data.t.dd, false, [], { alice: [] });
      await endpoint("bob", "/api/session/list", undefined, [200, []]);
      await checkState(data.t.dd, false, [], { alice: [], bob: [] });
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "empty session after reset is still empty",
    fn: async () => { // {{010}}}
      await endpoint("lanny", "/api/session/reset", { teamId: data.t.dd.id });
      await endpoint("alice", "/api/session/list", undefined, [200, []]);
      await endpoint("bob", "/api/session/list", undefined, [200, []]);
      await endpoint("mike", "/api/session/list", undefined, [200, []]);
      await checkState(data.t.d, false, [], { mike: [] });
      await checkState(data.t.dd, false, [], { alice: [], bob: [] });
    },
  });
  const fetchedProblems: {
    aliceOldDouble?: string;
    aliceDouble?: string;
    bobDouble?: string;
    aliceConcat?: string;
    bobConcat?: string;
    mikeConcat?: string;
  } = {};

  await t.step({
    ignore,
    name: "[ALICE] access public exercises not in session",
    fn: async () => { // {{020}}}
      const response = await endpoint(
        "alice",
        "/api/subject/problem/render",
        deuid("easy/double"),
      );
      const problem = response?.problem?.main;
      assert(typeof problem === "string");
      fetchedProblems.aliceOldDouble = problem;
      await endpoint(
        "alice",
        "/api/subject/problem/submit",
        {
          ...deuid("easy/double"),
          answer: {
            answers: [
              generateProblemAnswer("double", fetchedProblems.aliceOldDouble),
            ],
          },
        },
        [200, { info: [true] }],
      );
    },
  });

  await t.step({
    ignore,
    name: "[ALICE] can't access private exercises not in session",
    fn: async () => { // {{021}}}
      await endpoint(
        "alice",
        "/api/subject/problem/render",
        deuid("_easy/concat"),
        403,
      );
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[LANNY] add `double` exercise to session",
    fn: async () => { // {{030}}}
      await endpoint("lanny", "/api/session/add", {
        teamId: data.t.dd.id,
        ...deuid("easy/double"),
      });
      await checkState(data.t.dd, false, ["easy/double"], {
        alice: [null],
        bob: [null],
      });
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[LANNY] can't add non-existent execise to session",
    fn: async () => { // {{031}}}
      await endpoint("lanny", "/api/session/add", {
        teamId: data.t.dd.id,
        ...deuid("easy/nonexistent"),
      }, 404);
      await endpoint("lanny", "/api/session/add", {
        teamId: data.t.dd.id,
        ...deuid("nonexistent/double"),
      }, 404);
    },
  });

  await t.step({
    ignore,
    name: "one session doesn't bother another",
    fn: async () => { // {{032}}}
      await checkState(data.t.d, false, [], { mike: [] });
    },
  });

  await t.step({
    ignore,
    name: "same exercise renders differently in session",
    fn: async () => { // {{034}}}
      const response = await endpoint(
        "alice",
        "/api/subject/problem/render",
        deuid("easy/double"),
      );
      const problem = response?.problem?.main;
      assert(typeof problem === "string");
      fetchedProblems.aliceDouble = problem;
      assertNotEquals(problem, fetchedProblems.aliceOldDouble);
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "old answers don't work",
    fn: async () => { // {{037}}}
      await endpoint("alice", "/api/subject/problem/submit", {
        ...deuid("easy/double"),
        answer: {
          answers: [
            generateProblemAnswer(
              "double",
              fetchedProblems.aliceOldDouble ?? "never",
            ),
          ],
        },
      }, [200, { info: [false] }]);
      await checkState(data.t.dd, false, ["easy/double"], {
        alice: [0],
        bob: [null],
      });
    },
  });

  await t.step({
    ignore,
    name: "same exercise differs for other people",
    fn: async () => { // {{041}}}
      const response = await endpoint(
        "bob",
        "/api/subject/problem/render",
        deuid("easy/double"),
      );
      const problem = response?.problem?.main;
      assert(typeof problem === "string");
      fetchedProblems.bobDouble = problem;
      assertNotEquals(problem, fetchedProblems.aliceDouble);
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[BOB] send correct answer for `double`",
    fn: async () => { // {{050}}}
      await endpoint("bob", "/api/subject/problem/submit", {
        ...deuid("easy/double"),
        answer: {
          answers: [
            generateProblemAnswer("double", fetchedProblems.bobDouble ?? ""),
          ],
        },
      });
      await checkState(data.t.dd, false, ["easy/double"], {
        alice: [0],
        bob: [1],
      });
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[ALICE] beat her score",
    fn: async () => { // {{055}}}
      await endpoint("alice", "/api/subject/problem/submit", {
        ...deuid("easy/double"),
        answer: {
          answers: [
            generateProblemAnswer("double", fetchedProblems.aliceDouble ?? ""),
          ],
        },
      });
      await checkState(data.t.dd, false, ["easy/double"], {
        alice: [1],
        bob: [1],
      });
    },
  });

  await t.step({
    ignore,
    name: "answers in one session don't bother in another",
    fn: async () => { // {{060}}}
      await checkState(data.t.d, false, [], { mike: [] });
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[LANNY] add `concat` exercise to session",
    fn: async () => { // {{070}}}
      await endpoint("lanny", "/api/session/add", {
        teamId: data.t.dd.id,
        ...deuid("_easy/concat"),
      });
      await checkState(data.t.dd, false, ["easy/double", "_easy/concat"], {
        alice: [1, null],
        bob: [1, null],
      });
      let response = await endpoint(
        "bob",
        "/api/subject/problem/render",
        deuid("_easy/concat"),
      );
      let problem = response?.problem?.main;
      assert(typeof problem === "string");
      fetchedProblems.bobConcat = problem;
      response = await endpoint(
        "alice",
        "/api/subject/problem/render",
        deuid("_easy/concat"),
      );
      problem = response?.problem?.main;
      assert(typeof problem === "string");
      fetchedProblems.aliceConcat = problem;
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[ALICE] send correct answer for `concat`",
    fn: async () => { // {{080}}}
      await endpoint("alice", "/api/subject/problem/submit", {
        ...deuid("_easy/concat"),
        answer: {
          answers: [
            generateProblemAnswer("concat", fetchedProblems.aliceConcat ?? ""),
          ],
        },
      });
      await checkState(data.t.dd, false, ["easy/double", "_easy/concat"], {
        alice: [1, 1],
        bob: [1, null],
      });
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[LANNY] delete `double` exercise from session",
    fn: async () => { // {{090}}}
      await endpoint("lanny", "/api/session/delete", {
        teamId: data.t.dd.id,
        ...deuid("easy/double"),
      });
      await checkState(data.t.dd, false, ["_easy/concat"], {
        alice: [1],
        bob: [null],
      });
      const response = await endpoint(
        "alice",
        "/api/subject/problem/render",
        deuid("easy/double"),
      );
      const problem = response?.problem?.main;
      assert(typeof problem === "string");
      assertEquals(problem, fetchedProblems.aliceOldDouble);
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[RALPH] has own working session",
    fn: async () => { // {{100}}}
      await endpoint("ralph", "/api/session/add", {
        teamId: data.t.d.id,
        ...deuid("_easy/concat"),
      });
      await checkState(data.t.d, false, ["_easy/concat"], {
        mike: [null],
      });
      const response = await endpoint(
        "mike",
        "/api/subject/problem/render",
        deuid("_easy/concat"),
      );
      const problem = response?.problem?.main;
      assert(typeof problem === "string");
      fetchedProblems.mikeConcat = problem;
      await endpoint("mike", "/api/subject/problem/submit", {
        ...deuid("_easy/concat"),
        answer: {
          answers: [
            generateProblemAnswer("concat", problem),
          ],
        },
      });
      await checkState(data.t.d, false, ["_easy/concat"], {
        mike: [1],
      });
      await checkState(data.t.dd, false, ["_easy/concat"], {
        alice: [1],
        bob: [null],
      });
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[LANNY] end a session => [BOB] can't send answers",
    fn: async () => { // {{110}}}
      await endpoint("lanny", "/api/session/end", { teamId: data.t.dd.id });
      await checkState(data.t.dd, true, ["_easy/concat"], {
        alice: [1],
        bob: [null],
      });
      const tryAnswer = (answer: number) =>
        endpoint("bob", "/api/subject/problem/submit", {
          ...deuid("_easy/concat"),
          answer: { answers: [answer] },
        });
      let problem = fetchedProblems.bobConcat ?? "";
      await tryAnswer(generateProblemAnswer("concat", problem));
      await tryAnswer(generateProblemAnswer("concat", problem, false));
      const response = await endpoint(
        "bob",
        "/api/subject/problem/render",
        deuid("_easy/concat"),
      );
      problem = response?.problem?.main;
      assert(typeof problem === "string");
      await tryAnswer(generateProblemAnswer("concat", problem));
      await checkState(data.t.dd, true, ["_easy/concat"], {
        alice: [1],
        bob: [null],
      });
    },
  });

  ignore ||= !await t.step({
    ignore,
    name: "[LANNY] can't manage not own session",
    fn: async () => { // {{117}}}
      await endpoint("lanny", "/api/session/delete", {
        teamId: data.t.d.id,
        ...deuid("_easy/concat"),
      }, 403);
      await endpoint("lanny", "/api/session/add", {
        teamId: data.t.d.id,
        ...deuid("easy/double"),
      }, 403);
      await endpoint(
        "lanny",
        "/api/session/status",
        { teamId: data.t.d.id },
        403,
      );
      await endpoint("lanny", "/api/session/end", { teamId: data.t.d.id }, 403);
      await checkState(data.t.d, false, ["_easy/concat"], {
        mike: [1],
      });
    },
  });

  return ignore;
}

registerRoleTest(basename(import.meta.url), initSessionTests);
