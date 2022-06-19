// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert } from "../test_deps.ts";
import { endpointFactory, RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

interface DataEndpoint {
  "/api/user/info": { userId?: string };
}

export async function initRoleTests(t: Deno.TestContext, g: RoleTestContext) {
  const endpoint = endpointFactory<DataEndpoint>(g);

  const good = await t.step("exist", async (t) => {
    let user: keyof typeof data.u;
    for (user in data.u) {
      const info = data.u[user];
      const obj = {
        name: info.name,
        teamId: data.i[info.invitation],
        number: data.number(info),
      };
      const eve = user === "eve";
      await t.step((eve ? "not " : "") + user.toLocaleUpperCase(), async () => {
        if (eve) await endpoint(user, "/api/user/info", {}, 401);
        else await endpoint(user, "/api/user/info", {}, [200, obj]);
      });
    }
  });
  assert(good, "role init failed");
}
