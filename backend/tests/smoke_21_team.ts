// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert } from "../test_deps.ts";
import { RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

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

export async function initTeamTests(t: Deno.TestContext, g: RoleTestContext) {
  await t.step("exist", async (t) => {
    for (const team of Object.values(data.t)) {
      await t.step(team.n.toLocaleUpperCase(), async () => {
        await (await g.request())
          .post("/api/team/info")
          .set("Cookie", g.roles.root)
          .send({ teamId: team.id })
          .expect(200)
          .expect(generateInfo(team));
      });
    }
  });

  await t.step("[ROOT] list teams", async () => {
    await (await g.request())
      .get("/api/team/list")
      .set("Cookie", g.roles.root)
      .expect(200)
      .expect(
        [{
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
        }],
      );
  });

  await t.step("[EVE] can't list teams", async () => {
    await (await g.request())
      .get("/api/team/list")
      .expect(401);
  });

  await t.step("[ALICE] can't list teams", async () => {
    await (await g.request())
      .get("/api/team/list")
      .set("Cookie", g.roles.alice)
      .expect(403);
  });

  await t.step("[ALICE] can't create a team", async () => {
    await (await g.request())
      .post("/api/team/create")
      .set("Cookie", g.roles.alice)
      .send({
        name: data.dummy.t.name,
      })
      .expect(403);
  });

  await t.step("[EVE] can't create a team", async () => {
    await (await g.request())
      .post("/api/team/create")
      .send({
        name: data.t.d.n,
      })
      .expect(401);
  });

  await t.step("[ROOT] create team - bad", async () => {
    await (await g.request())
      .post("/api/team/create")
      .set("Cookie", g.roles.root)
      .send({
        name: data.dummy.t.id,
      })
      .expect(400);
  });

  await t.step("[BOB] get info about his team", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.bob)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200)
      .expect(generateInfo(data.t.dd, false, false));
  });

  await t.step("[ALICE] can't get info about other teams", async (t) => {
    for (
      const [id, name] of (["t", "d"] as const)
        .map((e) => [data.t[e].id, data.t[e].n] as const)
    ) {
      await t.step(name.toLocaleUpperCase(), async () => {
        await (await g.request())
          .post("/api/team/info")
          .set("Cookie", g.roles.alice)
          .send({
            teamId: id,
          })
          .expect(403);
      });
    }
  });

  await t.step("[LANNY] get info about own team", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200)
      .expect(generateInfo(data.t.dd));
  });

  await t.step("[RALPH] get info about not own team", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.ralph)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200)
      .expect(generateInfo(data.t.dd, false));
  });

  await t.step("[LANNY] close registration", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
        invitation: data.dummy.t.closingInv,
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200)
      .expect({
        ...generateInfo(data.t.dd, false),
        invitation: data.dummy.t.closingInv,
      });
  });

  await t.step("[LANNY] ranomize invitation of own team", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
        invitation: data.dummy.t.randomInv,
      })
      .expect(200);
    const response = await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200);
    const inv = response.body?.invitation;
    assert(inv !== null, "closed registration");
    assert(typeof inv === "string", "invalid object"); // throws if inv === undefined
    assert(inv !== data.t.dd.i, "invitation not changed");
  });

  await t.step("[LANNY] change invitation of own team", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
        invitation: data.t.dd.i,
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200)
      .expect(generateInfo(data.t.dd));
  });

  await t.step("[LANNY] change assignee of own team", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
        assignee: data.u.root.id,
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200)
      .expect({
        ...generateInfo(data.t.dd, false),
        // there is no invitation - Lanny not an assignee anymore
        assignee: {
          userId: data.u.root.id,
          name: data.u.root.name,
        },
      });
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.root)
      .send({
        teamId: data.t.dd.id,
        assignee: data.u.lanny.id,
      })
      .expect(200);
  });

  await t.step("[LANNY] can't change name of not own teams", async (t) => {
    for (
      const [id, name] of (["t", "d"] as const)
        .map((e) => [data.t[e].id, data.t[e].n] as const)
    ) {
      await t.step(name.toLocaleUpperCase(), async () => {
        await (await g.request())
          .post("/api/team/update")
          .set("Cookie", g.roles.lanny)
          .send({
            teamId: id,
            name: data.dummy.t.name,
          })
          .expect(403);
      });
    }
  });

  await t.step("[LANNY] change name of own team", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.t.dd.id,
        name: data.dummy.t.name,
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(200)
      .expect({
        ...generateInfo(data.t.dd),
        name: data.dummy.t.name,
      });
  });

  await t.step("[BOB] can't change name of his team", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.bob)
      .send({
        teamId: data.t.dd.id,
        name: data.dummy.t.name,
      })
      .expect(403);
  });

  await t.step(
    "[ROOT] can't change invitation to already taken one",
    async () => {
      await (await g.request())
        .post("/api/team/update")
        .set("Cookie", g.roles.root)
        .send({
          teamId: data.t.t.id,
          invitation: data.t.dd.i,
        })
        .expect(409);
    },
  );

  await t.step("[LANNY] create working team", async () => {
    await (await g.request())
      .post("/api/team/create")
      .set("Cookie", g.roles.lanny)
      .send({
        name: data.dummy.t.nextName,
      })
      .expect(200)
      .expect({ teamId: data.dummy.t.nextId });
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.dummy.t.nextId,
        invitation: data.dummy.t.inv,
      })
      .expect(200);
    await (await g.request())
      .post("/api/auth/register")
      .send(
        {
          login: data.dummy.u.login,
          name: data.dummy.u.name,
          hashedPassword: data.dummy.u.hPass,
          number: data.dummy.u.number,
          invitation: data.dummy.t.inv,
        },
      )
      .expect(200);
  });

  await t.step("[ALICE] can't delete a team", async () => {
    await (await g.request())
      .post("/api/team/delete")
      .set("Cookie", g.roles.alice)
      .send({
        teamId: data.t.dd.id,
      })
      .expect(403);
  });

  await t.step("[LANNY] delete a team", async () => {
    await (await g.request())
      .post("/api/team/delete")
      .set("Cookie", g.roles.lanny)
      .send({
        teamId: data.dummy.t.nextId,
      })
      .expect(200);
  });

  await t.step("[ROOT] can't get info about deleted team", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: data.dummy.t.nextId,
      })
      .expect(404);
  });
  await t.step("[LANNY] can't delete not own teams", async (t) => {
    for (
      const [id, name] of (["t", "d"] as const)
        .map((e) => [data.t[e].id, data.t[e].n] as const)
    ) {
      await t.step(name.toLocaleUpperCase(), async () => {
        await (await g.request())
          .post("/api/team/delete")
          .set("Cookie", g.roles.lanny)
          .send({
            teamId: id,
          })
          .expect(403);
      });
    }
  });

  await t.step("[ROOT] can't delete non-exiting team", async () => {
    await (await g.request())
      .post("/api/team/delete")
      .set("Cookie", g.roles.root)
      .send({
        teamId: data.dummy.t.id,
      })
      .expect(404);
  });
}
