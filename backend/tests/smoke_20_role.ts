// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert } from "../test_deps.ts";
import { RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

export async function initRoleTests(t: Deno.TestContext, g: RoleTestContext) {
  const good = await t.step("exist", async (t) => {
    let user: keyof typeof data.u;
    for (user in data.u) {
      const info = data.u[user];
      const obj = {
        name: info.name,
        teamId: data.i[info.invitation],
        number: data.number(info),
      };
      await t.step(user.toLocaleUpperCase(), async () => {
        await (await g.request())
          .post("/api/user/info")
          .set("Cookie", g.roles[user])
          .send({})
          .expect(200)
          .expect(obj);
      });
    }
  });
  assert(good, "role init failed");
}
