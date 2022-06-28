// Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2022 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-laterimport { basename } from "../deps.ts";

import { basename } from "../deps.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "../test_deps.ts";
import { data } from "./testdata/config.ts";
import { FailFastManager } from "./utils/fail-fast.ts";
import {
  endpointFactory,
  registerRoleTest,
  RoleTestContext,
} from "./smoke_mod.ts";

import "./smoke_26_session.ts"; // state from session file -- originally it was one suite of tests

interface DataEndpoint {
  "/api/session/list": undefined; // TODO: make it GET
  "/api/subject/problem/submit": {
    subject: string;
    exerciseId: string;
    answer: { answers: number[] };
  };
  "/api/session/add": { teamId: number; subject: string; exerciseId: string };
  "/api/session/reset": { teamId: number };
  "/api/session/report/list": { teamId: number };
  "/api/session/report/save": { teamId: number };
  "/api/session/report/delete": { filename: string };
}

export async function initReportTests(t: Deno.TestContext, g: RoleTestContext) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  const ffm = new FailFastManager(t, undefined);

  async function getStaticReport(
    user: keyof (typeof data)["u"],
    filename: string,
    expected = 200,
  ) {
    const res = await (await g.request())
      .get("/api/session/static/" + filename)
      .set("Cookie", g.roles[user])
      .expect(expected);
    return res.text;
  }

  await ffm.test("there is no reports", async () => { // {{200}}}
    for (
      const [_, t] of Object.entries(data.t).filter(([k, _]) => k != "t")
    ) {
      await endpoint(
        "root",
        "/api/session/report/list",
        { teamId: t.id },
        [200, { filenames: [] }],
      );
      await endpoint(
        t.a,
        "/api/session/report/list",
        { teamId: t.id },
        [200, { filenames: [] }],
      );
    }
  });

  await ffm.test("[Lanny] reference to non-existent report gives 404", async () => { // {{205}}}
    await getStaticReport(
      data.t.dd.a,
      `report_${data.t.dd.id}_0000-00-00T00:00:00.csv`,
      403,
    );
  });

  await ffm.test("[ALICE] reference to non-existent report gives 403", async () => { // {{206}}}
    await getStaticReport(
      "alice",
      `report_${data.t.dd.id}_0000-00-00T00:00:00.csv`,
      403,
    );
  });

  let firstReport: string;

  await ffm.test("reports in same state are same", async () => { // {{210}}} -- /* have same length */
    const genReportPromise = () =>
      endpoint("lanny", "/api/session/report/save", { teamId: data.t.dd.id });

    const reports = await Promise.all((await Promise.all(
      Array(2).fill(genReportPromise).map((e) => e()),
    )).map((e) => getStaticReport("lanny", e.filename)));

    assertEquals(reports.length, 2);
    assert(typeof reports[0] === "string" && typeof reports[1] === "string");
    firstReport = reports[0];
    assertEquals(reports[1].length, reports[0].length);
    assertEquals(reports[1], reports[0]); // comment me if needed
  }, true);

  await ffm.test("names and numbers are in report", () => { // {{215}}}
    for (const name of ["alice", "bob"] as const) {
      assertStringIncludes(firstReport, data.u[name].name);
      assertStringIncludes(firstReport, (data.u[name].number ?? "").toString());
    }
  });

  let ralphReport: string;
  let ralphReportUrl: string;

  await ffm.test(
    "[RALPH] generate a report for not ended session",
    async () => { // {{220}}}
      const res = await endpoint("ralph", "/api/session/report/save", {
        teamId: data.t.d.id,
      });
      ralphReportUrl = res.filename;
      ralphReport = await getStaticReport("ralph", ralphReportUrl);
      assertNotEquals(ralphReport, "");
    },
    true,
  );

  await ffm.test("adding answer changes report", async () => { // {{230}}}
    const ex = { subject: "easy", exerciseId: "double" };
    await endpoint("ralph", "/api/session/add", { teamId: data.t.d.id, ...ex });
    await endpoint(
      "mike",
      "/api/subject/problem/submit",
      { ...ex, answer: { answers: [0] } },
    );
    const res = await endpoint("ralph", "/api/session/report/save", {
      teamId: data.t.d.id,
    });
    const newRalphReport = await getStaticReport("ralph", res.filename);
    const assertGreater = (x: number, y: number) =>
      assert(x > y, `${x} <= ${y}`);
    assertGreater(newRalphReport.length, ralphReport.length);
  }, true);

  await ffm.test(
    "only those who vieved session are visible in report",
    async () => { // {{260}}}
      await endpoint("lanny", "/api/session/reset", { teamId: data.t.dd.id });
      await endpoint("lanny", "/api/session/add", {
        teamId: data.t.dd.id,
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
      });
      await endpoint("bob", "/api/subject/problem/submit", {
        subject: "fizyka",
        exerciseId: "pociagi-dwa-2",
        answer: {
          answers: [1, 1],
        },
      }, [200, { info: [true, true] }]);
      let res = await endpoint("lanny", "/api/session/report/save", {
        teamId: data.t.dd.id,
      });
      const onlyBobReport = await getStaticReport("lanny", res.filename);
      assertStringIncludes(onlyBobReport, data.u.bob.name);
      assert(!onlyBobReport.includes(data.u.alice.name));
      await endpoint("alice", "/api/session/list", undefined);
      res = await endpoint("lanny", "/api/session/report/save", {
        teamId: data.t.dd.id,
      });
      const report = await getStaticReport("lanny", res.filename);
      assertStringIncludes(report, data.u.alice.name);
      assertStringIncludes(report, data.u.bob.name);
    },
    true,
  );

  await ffm.test("[LANNY] can't access or delete not own reports", async () => { // {{270}}}
    await getStaticReport("lanny", ralphReportUrl, 403);
    await endpoint(
      "lanny",
      "/api/session/report/delete",
      { filename: ralphReportUrl },
      403,
    );
  });

  await ffm.test("[ALICE] can't manage reports", async () => { // {{275}}}
    await endpoint(
      "lanny",
      "/api/session/report/delete",
      { filename: ralphReportUrl },
      403,
    );
    await getStaticReport("ralph", ralphReportUrl);
    await getStaticReport("alice", ralphReportUrl, 403);
  });

  await ffm.test("teachers access and delete all reports", async () => { // {{280}}}
    for (const t of ["d", "dd"] as const) {
      const team = data.t[t];
      const getReports = async () =>
        await (await endpoint(team.a, "/api/session/report/list", {
          teamId: team.id,
        })).filenames;
      for (const r of await getReports()) {
        await getStaticReport(team.a, r);
        await endpoint(team.a, "/api/session/report/delete", { filename: r });
        await getStaticReport(team.a, r, 403);
      }
      assert((await getReports()).length === 0);
    }
  });

  return ffm.ignore;
}

registerRoleTest(basename(import.meta.url), initReportTests);
