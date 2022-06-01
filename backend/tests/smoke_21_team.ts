// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert } from "../test_deps.ts";
import { RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

export async function initTeamTests(t: Deno.TestContext, g: RoleTestContext) {
  await t.step("teachers' one exists", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({ teamId: 1 })
      .expect(200)
      .expect({
        name: "Teachers",
        assignee: { userId: data.root.id, name: data.root.name },
        invitation: data.teacher.invitation,
        members: [{
          userId: data.teacher.id,
          name: data.teacher.name,
          number: null,
        }, {
          userId: data.teacher2.id,
          name: data.teacher2.name,
          number: null,
        }],
      });
  });

  await t.step("Root - list teams", async () => {
    await (await g.request())
      .get("/api/team/list")
      .set("Cookie", g.roles.root)
      .expect(200)
      .expect(
        [{
          teamId: 1,
          name: "Teachers",
          assignee: {
            userId: data.root.id,
            name: data.root.name,
          },
          invitation: data.teacher.invitation,
        }, {
          teamId: 2,
          name: "2d",
          assignee: {
            userId: data.teacher.id,
            name: data.teacher.name,
          },
          invitation: data.student.invitation,
        }],
      );
  });

  await t.step("Not logged in - list teams", async () => {
    await (await g.request())
      .get("/api/team/list")
      .expect(401);
  });

  await t.step("Student - list teams", async () => {
    await (await g.request())
      .get("/api/team/list")
      .set("Cookie", g.roles.student)
      .expect(403);
  });

  await t.step("Student - try to create a team", async () => {
    await (await g.request())
      .post("/api/team/create")
      .set("Cookie", g.roles.student)
      .send({
        name: "3d",
      })
      .expect(403);
  });

  await t.step("Not logged in - try to create a team", async () => {
    await (await g.request())
      .post("/api/team/create")
      .send({
        name: "3d",
      })
      .expect(401);
  });

  await t.step("/team/create Bad Request", async () => {
    await (await g.request())
      .post("/api/team/create")
      .set("Cookie", g.roles.root)
      .send({
        name: 2,
      })
      .expect(400);
  });

  await t.step("Student - get info about team", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.student)
      .send({
        teamId: 2,
      })
      .expect(200)
      .expect({
        name: "2d",
        assignee: {
          name: data.teacher.name,
        },
        members: [
          {
            name: data.student.name,
            number: data.student.number,
          },
          {
            name: data.student2.name,
            number: data.student2.number,
          },
        ],
      });
  });

  await t.step("Student - get info about team (Unauthorized)", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.student)
      .send({
        teamId: 1,
      })
      .expect(403);
  });

  await t.step("Assignee - get info about team", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
      })
      .expect(200)
      .expect({
        name: "2d",
        assignee: {
          userId: data.teacher.id,
          name: data.teacher.name,
        },
        invitation: data.student.invitation,
        members: [
          {
            userId: data.student.id,
            name: data.student.name,
            number: data.student.number,
          },
          {
            userId: data.student2.id,
            name: data.student2.name,
            number: data.student2.number,
          },
        ],
      });
  });

  await t.step("Teacher - get info about team", async () => {
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
      })
      .expect(200)
      .expect({
        name: "2d",
        assignee: {
          userId: data.teacher.id,
          name: data.teacher.name,
        },
        invitation: data.student.invitation,
        members: [
          {
            userId: data.student.id,
            name: data.student.name,
            number: data.student.number,
          },
          {
            userId: data.student2.id,
            name: data.student2.name,
            number: data.student2.number,
          },
        ],
      });
  });

  await t.step("Assignee - close registration", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
        invitation: null,
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
      })
      .expect(200)
      .expect({
        name: "2d",
        assignee: {
          userId: data.teacher.id,
          name: data.teacher.name,
        },
        invitation: null,
        members: [
          {
            userId: data.student.id,
            name: data.student.name,
            number: data.student.number,
          },
          {
            userId: data.student2.id,
            name: data.student2.name,
            number: data.student2.number,
          },
        ],
      });
  });

  await t.step("Assignee - change team's invitation (random)", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
        invitation: "",
      })
      .expect(200);
    const response = await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: 2,
      })
      .expect(200);
    const inv = response.body?.invitation;
    assert(inv !== null, "closed registration");
    assert(typeof inv === "string", "invalid object"); // throws if inv === undefined
    assert(inv !== data.student.invitation, "invitation not changed");
  });

  await t.step("Assignee - change team's invitation", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
        invitation: data.student.invitation,
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: 2,
      })
      .expect(200)
      .expect({
        name: "2d",
        assignee: {
          userId: data.teacher.id,
          name: data.teacher.name,
        },
        invitation: data.student.invitation,
        members: [
          {
            userId: data.student.id,
            name: data.student.name,
            number: data.student.number,
          },
          {
            userId: data.student2.id,
            name: data.student2.name,
            number: data.student2.number,
          },
        ],
      });
  });

  await t.step("Assignee - change team's assignee", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
        assignee: data.root.id,
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: 2,
      })
      .expect(200)
      .expect({
        name: "2d",
        assignee: {
          userId: data.root.id,
          name: data.root.name,
        },
        invitation: data.student.invitation,
        members: [
          {
            userId: data.student.id,
            name: data.student.name,
            number: data.student.number,
          },
          {
            userId: data.student2.id,
            name: data.student2.name,
            number: data.student2.number,
          },
        ],
      });
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.root)
      .send({
        teamId: 2,
        assignee: data.teacher.id,
      })
      .expect(200);
  });

  await t.step("Teacher - change team's name", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 1,
        name: "0a",
      })
      .expect(403);
  });

  await t.step("Assignee - change team's name", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 2,
        name: "2dd",
      })
      .expect(200);
    await (await g.request())
      .post("/api/team/info")
      .set("Cookie", g.roles.root)
      .send({
        teamId: 2,
      })
      .expect(200)
      .expect({
        name: "2dd",
        assignee: {
          userId: data.teacher.id,
          name: data.teacher.name,
        },
        invitation: data.student.invitation,
        members: [
          {
            userId: data.student.id,
            name: data.student.name,
            number: data.student.number,
          },
          {
            userId: data.student2.id,
            name: data.student2.name,
            number: data.student2.number,
          },
        ],
      });
  });

  await t.step("Student - change team's name", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.student)
      .send({
        teamId: 2,
        name: "2d",
      })
      .expect(403);
  });

  await t.step("Admin - change team's invitation (taken)", async () => {
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.root)
      .send({
        teamId: 1,
        invitation: data.student.invitation,
      })
      .expect(409);
  });

  await t.step("Create team to be deleted", async () => {
    await (await g.request())
      .post("/api/team/create")
      .set("Cookie", g.roles.teacher)
      .send({
        name: "3dd",
      })
      .expect(200)
      .expect({ teamId: 3 });
    await (await g.request())
      .post("/api/team/update")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 3,
        invitation: "QwErTy59",
      })
      .expect(200);
    await (await g.request())
      .post("/api/auth/register")
      .send(
        {
          login: "user3@example.com",
          name: "User3",
          hashedPassword: data.student.hashedPassword,
          number: 11,
          invitation: "QwErTy59",
        },
      )
      .expect(200);
  });

  await t.step("Student - try to delete a team", async () => {
    await (await g.request())
      .post("/api/team/delete")
      .set("Cookie", g.roles.student)
      .send({
        teamId: 2,
      })
      .expect(403);
  });

  await t.step("Assignee - delete a team", async () => {
    await (await g.request())
      .post("/api/team/delete")
      .set("Cookie", g.roles.teacher)
      .send({
        teamId: 3,
      })
      .expect(200);
  });

  await t.step(
    "Try to get info about non-existing (deleted) team",
    async () => {
      await (await g.request())
        .post("/api/team/info")
        .set("Cookie", g.roles.root)
        .send({
          teamId: 3,
        })
        .expect(404);
    },
  );
  await t.step(
    "Teacher - try to delete a team. WARNING: If this test fails all the others may either",
    async () => {
      await (await g.request())
        .post("/api/team/delete")
        .set("Cookie", g.roles.teacher)
        .send({
          teamId: 1,
        })
        .expect(403);
    },
  );

  await t.step("Try to delete a non-exiting team", async () => {
    await (await g.request())
      .post("/api/team/delete")
      .set("Cookie", g.roles.root)
      .send({
        teamId: 1024,
      })
      .expect(404);
  });
}
