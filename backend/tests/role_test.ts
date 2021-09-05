// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, TestSuite } from "../test_deps.ts";
import { roleSuite } from "./role.ts";
import { data } from "./testdata/config.ts";

const validLoginSuite = new TestSuite({
  name: "validLogin",
  suite: roleSuite,
});

test(validLoginSuite, "root", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.root)
    .send({})
    .expect(200)
    .expect({ name: data.root.name, teamId: 0, number: null });
});

test(validLoginSuite, "teacher", async (context) => {
  await (await context.request())
    .post("/api/user/info")
    .set("Cookie", context.roles.teacher)
    .send({})
    .expect(200)
    .expect({ name: data.teacher.name, teamId: 1, number: null });
});

test(validLoginSuite, "student", async (context) => {
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
});
