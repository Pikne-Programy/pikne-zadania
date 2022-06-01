// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { E2eTestContext } from "./smoke_mod.ts";

export async function initE2eTests(t: Deno.TestContext, g: E2eTestContext) {
  await t.step("/ placeholder", async () => {
    await (await g.request())
      .get("/api")
      .expect(200)
      .expect({});
  });
}
