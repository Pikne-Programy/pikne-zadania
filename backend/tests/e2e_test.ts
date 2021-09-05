// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test } from "../test_deps.ts";
import { e2eSuite } from "./e2e.ts";

test(e2eSuite, "/ placeholder", async (context) => {
  await context.request
    .get("/api")
    .expect(200)
    .expect({});
});
