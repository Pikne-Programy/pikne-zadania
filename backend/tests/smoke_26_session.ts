// Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert, assertEquals, assertNotEquals } from "../test_deps.ts";
import { RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

function concatProblemDigits(problem: string) {
  return [...problem.matchAll(/\d+/g)].map((e) => e[0]).join("");
}

function generateProblemAnswer(
  exerciseId: "double" | "concat",
  problem: string,
  correct = true,
) {
  const digits = concatProblemDigits(problem);
  let r: number;
  switch (exerciseId) {
    case "double":
      assert(digits[0] === "0");
      r = 2 * parseFloat("0." + digits.substring(1));
      break;
    case "concat":
      r = parseInt(digits);
      break;
  }
  if (!correct) r /= 2;
  return r;
}

function deuid(uid: string) {
  const match = uid.match(/^([^/]*)\/([^/]*)$/);
  assert(match !== null);
  return { subject: match[1], exerciseId: match[2] };
}

type DataEndpoint = {
  "/api/session/status": { teamId: number };
  "/api/session/list": undefined;
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
};
type Endpoint = keyof DataEndpoint;

export async function initSessionTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
  async function request<T extends Endpoint>(
    auth: keyof RoleTestContext["roles"],
    endpoint: T,
    data: DataEndpoint[T],
    extra: number | [number, unknown] = 200,
  ) {
    const cookie = g.roles[auth];
    const t = (await g.request())
      .post(endpoint)
      .set("Cookie", cookie)
      .send(data);
    if (typeof extra === "number") t.expect(extra);
    else t.expect(...extra);
    return (await t).body;
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
      await request(
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
      }[] = (await request(client, "/api/session/list", undefined, 200));
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

  await t.step("only those who vieved session are visible", async () => { // {{005}}}
    await checkState(data.t.dd, false, [], {});
    await request("alice", "/api/session/list", undefined, [200, []]);
    await checkState(data.t.dd, false, [], { alice: [] });
    await request("bob", "/api/session/list", undefined, [200, []]);
    await checkState(data.t.dd, false, [], { alice: [], bob: [] });
  });

  await t.step("empty session after reset is still empty", async () => { // {{010}}}
    await request("lanny", "/api/session/reset", { teamId: data.t.dd.id });
    await request("alice", "/api/session/list", undefined, [200, []]);
    await request("bob", "/api/session/list", undefined, [200, []]);
    await request("mike", "/api/session/list", undefined, [200, []]);
    await checkState(data.t.d, false, [], { mike: [] });
    await checkState(data.t.dd, false, [], { alice: [], bob: [] });
  });
  const fetchedProblems: {
    aliceOldDouble?: string;
    aliceDouble?: string;
    bobDouble?: string;
    aliceConcat?: string;
    bobConcat?: string;
    mikeConcat?: string;
  } = {};

  await t.step("[ALICE] access public exercises not in session", async () => { // {{020}}}
    const response = await request(
      "alice",
      "/api/subject/problem/render",
      deuid("easy/double"),
    );
    const problem = response?.problem?.main;
    assert(typeof problem === "string");
    fetchedProblems.aliceOldDouble = problem;
    await request(
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
  });
  await t.step(
    "[ALICE] can't access private exercises not in session",
    async () => { // {{021}}}
      await request(
        "alice",
        "/api/subject/problem/render",
        deuid("_easy/concat"),
        403,
      );
    },
  );
  await t.step("[LANNY] add `double` exercise to session", async () => { // {{030}}}
    await request("lanny", "/api/session/add", {
      teamId: data.t.dd.id,
      ...deuid("easy/double"),
    });
    await checkState(data.t.dd, false, ["easy/double"], {
      alice: [null],
      bob: [null],
    });
  });
  await t.step(
    "[LANNY] can't add non-existent execise to session",
    async () => { // {{031}}}
      await request("lanny", "/api/session/add", {
        teamId: data.t.dd.id,
        ...deuid("easy/nonexistent"),
      }, 404);
      await request("lanny", "/api/session/add", {
        teamId: data.t.dd.id,
        ...deuid("nonexistent/double"),
      }, 404);
    },
  );
  await t.step("one session doesn't bother another", async () => { // {{032}}}
    await checkState(data.t.d, false, [], { mike: [] });
  });
  await t.step("same exercise renders differently in session", async () => { // {{034}}}
    const response = await request(
      "alice",
      "/api/subject/problem/render",
      deuid("easy/double"),
    );
    const problem = response?.problem?.main;
    assert(typeof problem === "string");
    fetchedProblems.aliceDouble = problem;
    assertNotEquals(problem, fetchedProblems.aliceOldDouble);
  });
  await t.step("old answers don't work", async () => { // {{037}}}
    await request("alice", "/api/subject/problem/submit", {
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
  });
  await t.step("same exercise differs for other people", async () => { // {{041}}}
    const response = await request(
      "bob",
      "/api/subject/problem/render",
      deuid("easy/double"),
    );
    const problem = response?.problem?.main;
    assert(typeof problem === "string");
    fetchedProblems.bobDouble = problem;
    assertNotEquals(problem, fetchedProblems.aliceDouble);
  });
  await t.step("[BOB] send correct answer for `double`", async () => { // {{050}}}
    await request("bob", "/api/subject/problem/submit", {
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
  });
  await t.step("[ALICE] beat her score", async () => { // {{055}}}
    await request("alice", "/api/subject/problem/submit", {
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
  });
  await t.step("answers in one session don't bother in another", async () => { // {{060}}}
    await checkState(data.t.d, false, [], { mike: [] });
  });
  await t.step("[LANNY] add `concat` exercise to session", async () => { // {{070}}}
    await request("lanny", "/api/session/add", {
      teamId: data.t.dd.id,
      ...deuid("_easy/concat"),
    });
    await checkState(data.t.dd, false, ["easy/double", "_easy/concat"], {
      alice: [1, null],
      bob: [1, null],
    });
    let response = await request(
      "bob",
      "/api/subject/problem/render",
      deuid("_easy/concat"),
    );
    let problem = response?.problem?.main;
    assert(typeof problem === "string");
    fetchedProblems.bobConcat = problem;
    response = await request(
      "alice",
      "/api/subject/problem/render",
      deuid("_easy/concat"),
    );
    problem = response?.problem?.main;
    assert(typeof problem === "string");
    fetchedProblems.aliceConcat = problem;
  });
  await t.step("[ALICE] send correct answer for `concat`", async () => { // {{080}}}
    await request("alice", "/api/subject/problem/submit", {
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
  });
  await t.step("[LANNY] delete `double` exercise from session", async () => { // {{090}}}
    await request("lanny", "/api/session/delete", {
      teamId: data.t.dd.id,
      ...deuid("easy/double"),
    });
    await checkState(data.t.dd, false, ["_easy/concat"], {
      alice: [1],
      bob: [null],
    });
    const response = await request(
      "alice",
      "/api/subject/problem/render",
      deuid("easy/double"),
    );
    const problem = response?.problem?.main;
    assert(typeof problem === "string");
    assertEquals(problem, fetchedProblems.aliceOldDouble);
  });
  await t.step("[RALPH] has own working session", async () => { // {{100}}}
    await request("lanny", "/api/session/add", {
      teamId: data.t.d.id,
      ...deuid("_easy/concat"),
    });
    await checkState(data.t.d, false, ["_easy/concat"], {
      mike: [null],
    });
    const response = await request(
      "mike",
      "/api/subject/problem/render",
      deuid("_easy/concat"),
    );
    const problem = response?.problem?.main;
    assert(typeof problem === "string");
    fetchedProblems.mikeConcat = problem;
    await request("mike", "/api/subject/problem/submit", {
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
  });
  await t.step(
    "[LANNY] end a session => [BOB] can't send answers",
    async () => { // {{110}}}
      await request("lanny", "/api/session/end", { teamId: data.t.dd.id });
      await checkState(data.t.dd, true, ["_easy/concat"], {
        alice: [1],
        bob: [null],
      });
      const tryAnswer = (answer: number) =>
        request("bob", "/api/subject/problem/submit", {
          ...deuid("_easy/concat"),
          answer: { answers: [answer] },
        });
      let problem = fetchedProblems.bobConcat ?? "";
      await tryAnswer(generateProblemAnswer("concat", problem));
      await tryAnswer(generateProblemAnswer("concat", problem, false));
      const response = await request(
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
  );
  await t.step("[LANNY] can't manage not own session", async () => { // {{117}}}
    await request("lanny", "/api/session/delete", {
      teamId: data.t.d.id,
      ...deuid("_easy/concat"),
    }, 403);
    await request("lanny", "/api/session/add", {
      teamId: data.t.d.id,
      ...deuid("easy/double"),
    }, 403);
    await request("lanny", "/api/session/status", { teamId: data.t.d.id }, 403);
    await request("lanny", "/api/session/end", { teamId: data.t.d.id }, 403);
    await checkState(data.t.d, false, ["_easy/concat"], {
      mike: [1],
    });
  });
}