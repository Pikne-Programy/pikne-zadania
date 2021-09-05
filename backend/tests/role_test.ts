// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, TestSuite } from "../test_deps.ts";
import { roleSuite } from "./role.ts";

const validLoginSuite = new TestSuite({
  name: "validLogin",
  suite: roleSuite,
});

test(validLoginSuite, "root", async (context) => {
  await context.request
    .post("/api/user/info")
    .set("Cookie", context.roles.root)
    .send({})
    .expect(200)
    .expect({ name: "root", teamId: 0, number: null });
});
