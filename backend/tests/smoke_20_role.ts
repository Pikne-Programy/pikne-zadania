// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

export async function initRoleTests(t: Deno.TestContext, g: RoleTestContext) {
  await t.step("root", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.root)
      .send({})
      .expect(200)
      .expect({ name: data.root.name, teamId: 0, number: null });
  });

  await t.step("teacher", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.teacher)
      .send({})
      .expect(200)
      .expect({ name: data.teacher.name, teamId: 1, number: null });
  });

  await t.step("teacher2", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.teacher2)
      .send({})
      .expect(200)
      .expect({ name: data.teacher2.name, teamId: 1, number: null });
  });

  await t.step("student", async () => {
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

  await t.step("student2", async () => {
    await (await g.request())
      .post("/api/user/info")
      .set("Cookie", g.roles.student2)
      .send({})
      .expect(200)
      .expect({
        name: data.student2.name,
        teamId: 2,
        number: data.student2.number,
      });
  });
}
