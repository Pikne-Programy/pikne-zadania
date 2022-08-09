// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { basename } from "../deps.ts";
import { assert } from "../test_deps.ts";
import {
  endpointFactory,
  registerRoleTest,
  RoleTestContext,
} from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";
import { FailFastManager } from "./utils/fail-fast.ts";

type Teams = (typeof data)["t"];
function generateInfo(team: Teams[keyof Teams], inv = true, t = true) {
  const a = data.u[team.a];
  return {
    name: team.n,
    assignee: { ...(t ? { userId: a.id } : {}), name: a.name },
    ...(inv ? { invitation: team.i } : {}),
    members: team.m.map((e) => ({
      ...(t ? { userId: data.u[e].id } : {}),
      name: data.u[e].name,
      number: data.number(data.u[e]),
    })),
  };
}

interface DataEndpoint {
  "/api/auth/register": {
    login: string;
    name: string;
    hashedPassword: string;
    number: number;
    invitation: string;
  };
  ":/api/team/list": undefined;
  "/api/team/create": { name: string };
  "/api/team/info": { teamId: number };
  "/api/team/update": {
    teamId: number;
    invitation?: string | "" | null;
    assignee?: string;
    name?: string;
  };
  "/api/team/delete": { teamId: number };
}

export async function initTeamTests(t: Deno.TestContext, g: RoleTestContext) {
  const endpoint = endpointFactory<DataEndpoint>(g);
  const ffm = new FailFastManager(t, undefined);

  await ffm.test("exist", async (t) => {
    for (const team of Object.values(data.t)) {
      await t.step(team.n.toLocaleUpperCase(), async () => {
        await endpoint(
          "root",
          "/api/team/info",
          { teamId: team.id },
          [200, generateInfo(team)],
        );
      });
    }
  });

  await ffm.test("[ROOT] list teams", async () => {
    await endpoint("root", ":/api/team/list", undefined, [200, [{
      teamId: data.t.t.id,
      name: data.t.t.n,
      assignee: {
        userId: data.u.root.id,
        name: data.u.root.name,
      },
      invitation: data.t.t.i,
    }, {
      teamId: data.t.dd.id,
      name: data.t.dd.n,
      assignee: {
        userId: data.u.lanny.id,
        name: data.u.lanny.name,
      },
      invitation: data.t.dd.i,
    }, {
      teamId: data.t.d.id,
      name: data.t.d.n,
      assignee: {
        userId: data.u.ralph.id,
        name: data.u.ralph.name,
      },
      invitation: data.t.d.i,
    }]]);
  });

  await ffm.test("[EVE] can't list teams", async () => {
    await endpoint("eve", ":/api/team/list", undefined, 401);
  });

  await ffm.test("[ALICE] can't list teams", async () => {
    await endpoint("alice", ":/api/team/list", undefined, 403);
  });

  await ffm.test("[ALICE] can't create a team", async () => {
    await endpoint(
      "alice",
      "/api/team/create",
      { name: data.dummy.t.name },
      403,
    );
  }, true);

  await ffm.test("[EVE] can't create a team", async () => {
    await endpoint(
      "eve",
      "/api/team/create",
      { name: data.dummy.t.name },
      401,
    );
  }, true);

  await ffm.test("[ROOT] create team - bad", async () => {
    await endpoint(
      "root",
      "/api/team/create",
      { name: data.dummy.t.id as unknown as string },
      400,
    );
  }, true);

  await ffm.test("[BOB] get info about his team", async () => {
    await endpoint(
      "bob",
      "/api/team/info",
      { teamId: data.t.dd.id },
      [200, generateInfo(data.t.dd, false, false)],
    );
  });

  await ffm.test("[ALICE] can't get info about other teams", async (t) => {
    for (
      const [id, name] of (["t", "d"] as const)
        .map((e) => [data.t[e].id, data.t[e].n] as const)
    ) {
      await t.step(name.toLocaleUpperCase(), async () => {
        await endpoint(
          "alice",
          "/api/team/info",
          { teamId: id },
          403,
        );
      });
    }
  });

  await ffm.test("[LANNY] get info about own team", async () => {
    await endpoint(
      "lanny",
      "/api/team/info",
      { teamId: data.t.dd.id },
      [200, generateInfo(data.t.dd)],
    );
  });

  await ffm.test("[RALPH] get info about not own team", async () => {
    await endpoint(
      "ralph",
      "/api/team/info",
      { teamId: data.t.dd.id },
      [200, generateInfo(data.t.dd, false)],
    );
  });

  await ffm.test("[LANNY] close registration", async () => {
    await endpoint(
      "lanny",
      "/api/team/update",
      { teamId: data.t.dd.id, invitation: data.dummy.t.closingInv },
      200,
    );
    await endpoint(
      "lanny",
      "/api/team/info",
      { teamId: data.t.dd.id },
      [200, {
        ...generateInfo(data.t.dd, false),
        invitation: data.dummy.t.closingInv,
      }],
    );
  }, true);

  await ffm.test("[LANNY] ranomize invitation of own team", async () => {
    await endpoint(
      "lanny",
      "/api/team/update",
      { teamId: data.t.dd.id, invitation: data.dummy.t.randomInv },
      200,
    );
    const response = await endpoint(
      "root",
      "/api/team/info",
      { teamId: data.t.dd.id },
      200,
    );
    const inv = response?.invitation;
    assert(inv !== null, "closed registration");
    assert(typeof inv === "string", "invalid object"); // throws if inv === undefined
    assert(inv !== data.t.dd.i, "invitation not changed");
  });

  await ffm.test("[LANNY] change invitation of own team", async () => {
    await endpoint(
      "lanny",
      "/api/team/update",
      { teamId: data.t.dd.id, invitation: data.t.dd.i },
      200,
    );
    await endpoint(
      "root",
      "/api/team/info",
      { teamId: data.t.dd.id },
      [200, generateInfo(data.t.dd)],
    );
  }, true);

  await ffm.test("[LANNY] change assignee of own team", async () => {
    await endpoint(
      "lanny",
      "/api/team/update",
      { teamId: data.t.dd.id, assignee: data.u.root.id },
      200,
    );
    await endpoint(
      "lanny",
      "/api/team/info",
      { teamId: data.t.dd.id },
      [200, {
        ...generateInfo(data.t.dd, false),
        // there is no invitation - Lanny not an assignee anymore
        assignee: {
          userId: data.u.root.id,
          name: data.u.root.name,
        },
      }],
    );
    await endpoint(
      "root",
      "/api/team/update",
      { teamId: data.t.dd.id, assignee: data.u.lanny.id },
      200,
    );
  }, true);

  await ffm.test("[LANNY] can't change name of not own teams", async (t) => {
    for (
      const [id, name] of (["t", "d"] as const)
        .map((e) => [data.t[e].id, data.t[e].n] as const)
    ) {
      await t.step(name.toLocaleUpperCase(), async () => {
        await endpoint(
          "lanny",
          "/api/team/update",
          { teamId: id, name: data.dummy.t.name },
          403,
        );
      });
    }
  }, true);

  await ffm.test("[LANNY] change name of own team", async () => {
    await endpoint(
      "lanny",
      "/api/team/update",
      { teamId: data.t.dd.id, name: data.dummy.t.name },
      200,
    );
    await endpoint(
      "root",
      "/api/team/info",
      { teamId: data.t.dd.id },
      [200, { ...generateInfo(data.t.dd), name: data.dummy.t.name }],
    );
  }, true);

  await ffm.test("[BOB] can't change name of his team", async () => {
    await endpoint(
      "bob",
      "/api/team/update",
      { teamId: data.t.dd.id, name: data.dummy.t.name },
      403,
    );
  }, true);

  await ffm.test(
    "[ROOT] can't change invitation to already taken one",
    async () => {
      await endpoint(
        "root",
        "/api/team/update",
        { teamId: data.t.t.id, invitation: data.t.dd.i },
        409,
      );
    },
    true,
  );

  await ffm.test("[LANNY] create working team", async () => {
    await endpoint(
      "lanny",
      "/api/team/create",
      { name: data.dummy.t.nextName },
      [200, { teamId: data.dummy.t.nextId }],
    );
    await endpoint(
      "lanny",
      "/api/team/update",
      { teamId: data.dummy.t.nextId, invitation: data.dummy.t.inv },
      200,
    );
    await endpoint(
      "eve",
      "/api/auth/register",
      {
        login: data.dummy.u.login,
        name: data.dummy.u.name,
        hashedPassword: data.dummy.u.hPass,
        number: data.dummy.u.number,
        invitation: data.dummy.t.inv,
      },
      200,
    );
  }, true);

  await ffm.test("[ALICE] can't delete a team", async () => {
    await endpoint(
      "alice",
      "/api/team/delete",
      { teamId: data.t.dd.id },
      403,
    );
  }, true);

  await ffm.test("[LANNY] delete a team", async () => {
    await endpoint(
      "lanny",
      "/api/team/delete",
      { teamId: data.dummy.t.nextId },
      200,
    );
  }, true);

  await ffm.test("[ROOT] can't get info about deleted team", async () => {
    await endpoint(
      "root",
      "/api/team/info",
      { teamId: data.dummy.t.nextId },
      404,
    );
  });

  await ffm.test("[LANNY] can't delete not own teams", async (t) => {
    for (
      const [id, name] of (["t", "d"] as const)
        .map((e) => [data.t[e].id, data.t[e].n] as const)
    ) {
      await t.step(name.toLocaleUpperCase(), async () => {
        await endpoint(
          "lanny",
          "/api/team/delete",
          { teamId: id },
          403,
        );
      });
    }
  }, true);

  await ffm.test("[ROOT] can't delete non-exiting team", async () => {
    await endpoint(
      "root",
      "/api/team/delete",
      { teamId: data.dummy.t.id },
      404,
    );
  });

  return ffm.ignore;
}

registerRoleTest(basename(import.meta.url), initTeamTests);
