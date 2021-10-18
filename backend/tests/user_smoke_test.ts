// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, TestSuite } from "../test_deps.ts";
import { roleSuite } from "./role.ts";
import { data } from "./testdata/config.ts";

const userSuite = new TestSuite({
  name: "user",
  suite: roleSuite,
});

test(userSuite, "root exists", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.root)
    .expect(200)
    .send({})
    .expect({
      name: data.root.name,
      teamId: 0,
      number: null,
    });
});

test(userSuite, "Create another user", async (context) => {
  await (await context.request())
    .post("/api/auth/register")
    .send({
      login: "user2@example.com",
      name: "User2",
      hashedPassword: data.student.hashedPassword,
      number: 11,
      invitation: data.student.invitation,
    })
    .expect(200);
});

test(userSuite, "Teacher - get info about student", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.teacher)
    .send({ userId: data.student.id })
    .expect(200)
    .expect({
      name: data.student.name,
      teamId: 2,
      number: data.student.number,
    });
});

test(
  userSuite,
  "Get info about currently authenticated student",
  async (context) => {
    await (await context.request())
      .post("/api/user/info")
      .set("Cookie", context.roles.student)
      .send({})
      .expect(200)
      .expect({
        name: data.student.name,
        teamId: 2,
        number: data.student.number,
      });
  },
);

test(userSuite, "Student - get info about another student", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.student)
    .send({ userId: data.student2.id })
    .expect(403);
});

test(userSuite, "Student - get info about teacher", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.student)
    .send({ userId: data.teacher.id })
    .expect(403);
});

test(userSuite, "Student - get info about admin", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.student)
    .send({ userId: data.root.id })
    .expect(403);
});

test(userSuite, "Not logged in - get info about student", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .send({ userId: data.student.id })
    .expect(401);
});

test(userSuite, "Not logged in - get info", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .send({})
    .expect(401);
});

test(userSuite, "Root - update student's name and number", async (context) => {
  await (await context.request())
    .post("/api/user/update")
    .set("Cookie", context.roles.root)
    .send({ userId: data.student.id, name: "Student", number: 11 })
    .expect(200);
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.student)
    .send({})
    .expect(200)
    .expect({
      name: "Student",
      teamId: 2,
      number: 11,
    });
});

test(
  userSuite,
  "Assignee - update student's name and number",
  async (context) => {
    await (await context.request())
      .post("/api/user/update")
      .set("Cookie", context.roles.teacher)
      .send({
        userId: data.student.id,
        name: data.student.name,
        number: data.student.number,
      })
      .expect(200);
    await (await context.request())
      .post("/api/user/info")
      .set("Cookie", context.roles.student)
      .send({})
      .expect(200)
      .expect({
        name: data.student.name,
        teamId: 2,
        number: data.student.number,
      });
  },
);

test(
  userSuite,
  "Teacher - update student's name and number",
  async (context) => {
    await (await context.request())
      .post("/api/user/update")
      .set("Cookie", context.roles.teacher2)
      .send({ userId: data.student.id, name: "User", number: 1 })
      .expect(403);
  },
);

test(userSuite, "Teacher - update admin's name", async (context) => {
  await (await context.request())
    .post("/api/user/update")
    .set("Cookie", context.roles.teacher)
    .send({ userId: data.root.id, name: "rooot" })
    .expect(403);
});

test(userSuite, "Student - update another student's name", async (context) => {
  await (await context.request())
    .post("/api/user/update")
    .set("Cookie", context.roles.student)
    .send({ userId: data.student2.id, name: "User2" })
    .expect(403);
});

test(userSuite, "Student - try to delete a student", async (context) => {
  await (await context.request())
    .post("/api/user/delete")
    .set("Cookie", context.roles.student)
    .send({ userId: data.student2.id })
    .expect(403);
});

test(userSuite, "Teacher - try to delete a student", async (context) => {
  await (await context.request())
    .post("/api/user/delete")
    .set("Cookie", context.roles.teacher2)
    .send({ userId: data.student2.id })
    .expect(403);
});

test(userSuite, "Not logged in - try to delete a student", async (context) => {
  await (await context.request())
    .post("/api/user/delete")
    .send({ userId: data.student2.id })
    .expect(401);
});

test(userSuite, "Assignee - delete a student", async (context) => {
  await (await context.request())
    .post("/api/user/delete")
    .set("Cookie", context.roles.teacher)
    .send({ userId: data.student2.id })
    .expect(200);
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.root)
    .send({ userId: data.student2.id })
    .expect(404);
});

test(
  userSuite,
  "Admin - try to update a non-existing student",
  async (context) => {
    await (await context.request())
      .post("/api/user/delete")
      .set("Cookie", context.roles.root)
      .send({ userId: data.student2.id, name: "Student2" })
      .expect(404);
  },
);
