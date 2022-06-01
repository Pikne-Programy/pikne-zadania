// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

export async function initUserTests(t: Deno.TestContext, g: RoleTestContext) {
  await t.step("root exists", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.root)
      .expect(200)
      .send({})
      .expect({
        name: data.root.name,
        teamId: 0,
        number: null,
      });
  });

  await t.step("Create another user", async () => {
    await (await g.request())
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

  await t.step("Teacher - get info about student", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.teacher)
      .send({ userId: data.student.id })
      .expect(200)
      .expect({
        name: data.student.name,
        teamId: 2,
        number: data.student.number,
      });
  });

  await t.step("Get info about currently authenticated student", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.student)
      .send({})
      .expect(200)
      .expect({
        name: data.student.name,
        teamId: 2,
        number: data.student.number,
      });
  });

  await t.step("Student - get info about another student", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.student)
      .send({ userId: data.student2.id })
      .expect(403);
  });

  await t.step("Student - get info about teacher", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.student)
      .send({ userId: data.teacher.id })
      .expect(403);
  });

  await t.step("Student - get info about admin", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.student)
      .send({ userId: data.root.id })
      .expect(403);
  });

  await t.step("Not logged in - get info about student", async () => {
    await (await g.request())
      .post("/api/user/info")
      .send({ userId: data.student.id })
      .expect(401);
  });

  await t.step("Not logged in - get info", async () => {
    await (await g.request())
      .post("/api/user/info")
      .send({})
      .expect(401);
  });

  await t.step("Root - update student's name and number", async () => {
    await (await g.request())
      .post("/api/user/update")
      .set("Cookie", g.roles.root)
      .send({ userId: data.student.id, name: "Student", number: 11 })
      .expect(200);
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.student)
      .send({})
      .expect(200)
      .expect({
        name: "Student",
        teamId: 2,
        number: 11,
      });
  });

  await t.step("Assignee - update student's name and number", async () => {
    await (await g.request())
      .post("/api/user/update")
      .set("Cookie", g.roles.teacher)
      .send({
        userId: data.student.id,
        name: data.student.name,
        number: data.student.number,
      })
      .expect(200);
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.student)
      .send({})
      .expect(200)
      .expect({
        name: data.student.name,
        teamId: 2,
        number: data.student.number,
      });
  });

  await t.step("Teacher - update student's name and number", async () => {
    await (await g.request())
      .post("/api/user/update")
      .set("Cookie", g.roles.teacher2)
      .send({ userId: data.student.id, name: "User", number: 1 })
      .expect(403);
  });

  await t.step("Teacher - update admin's name", async () => {
    await (await g.request())
      .post("/api/user/update")
      .set("Cookie", g.roles.teacher)
      .send({ userId: data.root.id, name: "rooot" })
      .expect(403);
  });

  await t.step("Student - update another student's name", async () => {
    await (await g.request())
      .post("/api/user/update")
      .set("Cookie", g.roles.student)
      .send({ userId: data.student2.id, name: "User2" })
      .expect(403);
  });

  await t.step("Student - try to delete a student", async () => {
    await (await g.request())
      .post("/api/user/delete")
      .set("Cookie", g.roles.student)
      .send({ userId: data.student2.id })
      .expect(403);
  });

  await t.step("Teacher - try to delete a student", async () => {
    await (await g.request())
      .post("/api/user/delete")
      .set("Cookie", g.roles.teacher2)
      .send({ userId: data.student2.id })
      .expect(403);
  });

  await t.step("Not logged in - try to delete a student", async () => {
    await (await g.request())
      .post("/api/user/delete")
      .send({ userId: data.student2.id })
      .expect(401);
  });

  await t.step("Assignee - delete a student", async () => {
    await (await g.request())
      .post("/api/user/delete")
      .set("Cookie", g.roles.teacher)
      .send({ userId: data.student2.id })
      .expect(200);
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.root)
      .send({ userId: data.student2.id })
      .expect(404);
  });

  await t.step("Admin - try to update a non-existing student", async () => {
    await (await g.request())
      .post("/api/user/delete")
      .set("Cookie", g.roles.root)
      .send({ userId: data.student2.id, name: "Student2" })
      .expect(404);
  });
}
