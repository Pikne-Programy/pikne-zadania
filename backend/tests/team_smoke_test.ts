// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, TestSuite } from "../test_deps.ts";
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
      }],
    });
});
