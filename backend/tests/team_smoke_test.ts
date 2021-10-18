// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert, test, TestSuite } from "../test_deps.ts";
import { roleSuite } from "./role.ts";
import { data } from "./testdata/config.ts";

const teamSuite = new TestSuite({
  name: "team",
  suite: roleSuite,
});

test(teamSuite, "teachers' one exists", async (context) => {
  await (await context.request())
    .post("/api/team/info")
    .set("Cookie", context.roles.root)
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

test(teamSuite, "Root - list teams", async (context) => {
  await (await context.request())
    .get("/api/team/list")
    .set("Cookie", context.roles.root)
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

test(teamSuite, "Not logged in - list teams", async (context) => {
  await (await context.request())
    .get("/api/team/list")
    .expect(401);
});

test(teamSuite, "Student - list teams", async (context) => {
  await (await context.request())
    .get("/api/team/list")
    .set("Cookie", context.roles.student)
    .expect(403);
});

test(teamSuite, "Student - try to create a team", async (context) => {
  await (await context.request())
    .post("/api/team/create")
    .set("Cookie", context.roles.student)
    .send({
      name: "3d",
    })
    .expect(403);
});

test(teamSuite, "Not logged in - try to create a team", async (context) => {
  await (await context.request())
    .post("/api/team/create")
    .send({
      name: "3d",
    })
    .expect(401);
});

test(teamSuite, "/team/create Bad Request", async (context) => {
  await (await context.request())
    .post("/api/team/create")
    .set("Cookie", context.roles.root)
    .send({
      name: 2,
    })
    .expect(400);
});

test(teamSuite, "Student - get info about team", async (context) => {
  await (await context.request())
    .post("/api/team/info")
    .set("Cookie", context.roles.student)
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

test(
  teamSuite,
  "Student - get info about team (Unauthorized)",
  async (context) => {
    await (await context.request())
      .post("/api/team/info")
      .set("Cookie", context.roles.student)
      .send({
        teamId: 1,
      })
      .expect(403);
  },
);

test(teamSuite, "Assignee - get info about team", async (context) => {
  await (await context.request())
    .post("/api/team/info")
    .set("Cookie", context.roles.teacher)
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

test(teamSuite, "Teacher - get info about team", async (context) => {
  await (await context.request())
    .post("/api/team/info")
    .set("Cookie", context.roles.teacher)
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

test(teamSuite, "Assignee - close registration", async (context) => {
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.teacher)
    .send({
      teamId: 2,
      invitation: null,
    })
    .expect(200);
  await (await context.request())
    .post("/api/team/info")
    .set("Cookie", context.roles.teacher)
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

test(
  teamSuite,
  "Assignee - change team's invitation (random)",
  async (context) => {
    await (await context.request())
      .post("/api/team/update")
      .set("Cookie", context.roles.teacher)
      .send({
        teamId: 2,
        invitation: "",
      })
      .expect(200);
    const response = await (await context.request())
      .post("/api/team/info")
      .set("Cookie", context.roles.root)
      .send({
        teamId: 2,
      })
      .expect(200);
    const inv = response.body?.invitation;
    assert(inv !== null, "closed registration");
    assert(typeof inv === "string", "invalid object"); // throws if inv === undefined
    assert(inv !== data.student.invitation, "invitation not changed");
  },
);

test(
  teamSuite,
  "Assignee - change team's invitation",
  async (context) => {
    await (await context.request())
      .post("/api/team/update")
      .set("Cookie", context.roles.teacher)
      .send({
        teamId: 2,
        invitation: data.student.invitation,
      })
      .expect(200);
    await (await context.request())
      .post("/api/team/info")
      .set("Cookie", context.roles.root)
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
  },
);

test(teamSuite, "Assignee - change team's assignee", async (context) => {
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.teacher)
    .send({
      teamId: 2,
      assignee: data.root.id,
    })
    .expect(200);
  await (await context.request())
    .post("/api/team/info")
    .set("Cookie", context.roles.root)
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
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.root)
    .send({
      teamId: 2,
      assignee: data.teacher.id,
    })
    .expect(200);
});

test(teamSuite, "Teacher - change team's name", async (context) => {
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.teacher)
    .send({
      teamId: 1,
      name: "0a",
    })
    .expect(403);
});

test(teamSuite, "Assignee - change team's name", async (context) => {
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.teacher)
    .send({
      teamId: 2,
      name: "2dd",
    })
    .expect(200);
  await (await context.request())
    .post("/api/team/info")
    .set("Cookie", context.roles.root)
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

test(teamSuite, "Student - change team's name", async (context) => {
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.student)
    .send({
      teamId: 2,
      name: "2d",
    })
    .expect(403);
});

test(teamSuite, "Admin - change team's invitation (taken)", async (context) => {
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.root)
    .send({
      teamId: 1,
      invitation: data.student.invitation,
    })
    .expect(409);
});

test(teamSuite, "Create team to be deleted", async (context) => {
  await (await context.request())
    .post("/api/team/create")
    .set("Cookie", context.roles.teacher)
    .send({
      name: "3dd",
    })
    .expect(200)
    .expect({ teamId: 3 });
  await (await context.request())
    .post("/api/team/update")
    .set("Cookie", context.roles.teacher)
    .send({
      teamId: 3,
      invitation: "QwErTy59",
    })
    .expect(200);
  await (await context.request())
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

test(teamSuite, "Student - try to delete a team", async (context) => {
  await (await context.request())
    .post("/api/team/delete")
    .set("Cookie", context.roles.student)
    .send({
      teamId: 2,
    })
    .expect(403);
});

test(teamSuite, "Assignee - delete a team", async (context) => {
  await (await context.request())
    .post("/api/team/delete")
    .set("Cookie", context.roles.teacher)
    .send({
      teamId: 3,
    })
    .expect(200);
});

test(
  teamSuite,
  "Try to get info about non-existing (deleted) team",
  async (context) => {
    await (await context.request())
      .post("/api/team/info")
      .set("Cookie", context.roles.root)
      .send({
        teamId: 3,
      })
      .expect(404);
  },
);
test(
  teamSuite,
  "Teacher - try to delete a team. WARNING: If this test fails all the others may either",
  async (context) => {
    await (await context.request())
      .post("/api/team/delete")
      .set("Cookie", context.roles.teacher)
      .send({
        teamId: 1,
      })
      .expect(403);
  },
);

test(teamSuite, "Try to delete a non-exiting team", async (context) => {
  await (await context.request())
    .post("/api/team/delete")
    .set("Cookie", context.roles.root)
    .send({
      teamId: 1024,
    })
    .expect(404);
});
