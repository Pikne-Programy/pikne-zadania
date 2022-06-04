// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assertEquals, copy, superoak } from "../test_deps.ts";
import { constructApp } from "../app.ts";
import { data, lazyDefaultConfig } from "./testdata/config.ts";
import { bench, E2eTestContext } from "./smoke_mod.ts";
import {
  createTeam,
  login,
  register,
  updateTeamInvitation,
} from "./utils/user.ts";

import { initE2eTests } from "./smoke_10_e2e.ts";
import { initRoleTests } from "./smoke_20_role.ts";
import { initTeamTests } from "./smoke_21_team.ts";
import { initUserTests } from "./smoke_22_user.ts";
import { initProblemTests } from "./smoke_23_problem.ts";
import { initHierarchyTests } from "./smoke_24_hierarchy.ts";
import { initSubjectTests } from "./smoke_25_subject.ts";

async function initRole(e2eCtx: E2eTestContext) {
  const root = await login(e2eCtx, data.u.root);
  await updateTeamInvitation(e2eCtx, root, data.t.t.id, data.t.t.i);
  await register(e2eCtx, data.u.lanny);
  const lanny = await login(e2eCtx, data.u.lanny);
  await register(e2eCtx, data.u.ralph);
  const ralph = await login(e2eCtx, data.u.ralph);
  assertEquals(await createTeam(e2eCtx, lanny, data.t.dd.n), data.t.dd.id);
  await updateTeamInvitation(e2eCtx, lanny, data.t.dd.id, data.t.dd.i);
  await register(e2eCtx, data.u.alice);
  const alice = await login(e2eCtx, data.u.alice);
  await register(e2eCtx, data.u.bob);
  const bob = await login(e2eCtx, data.u.bob);
  assertEquals(await createTeam(e2eCtx, ralph, data.t.d.n), data.t.d.id);
  await updateTeamInvitation(e2eCtx, ralph, data.t.d.id, data.t.d.i);
  await register(e2eCtx, data.u.mike);
  const mike = await login(e2eCtx, data.u.mike);
  return {
    ...e2eCtx,
    roles: { root, lanny, ralph, alice, bob, mike },
  };
}

type TC = Deno.TestContext;
function wrapper<T>(t: TC, ctx: T, n: string, fn: (t: TC, ctx: T) => unknown) {
  return t.step(n, async (t) => {
    await fn(t, ctx);
  });
}

Deno.test("smoke", async (t) => {
  await bench("init exercises", async () => {
    await Deno.remove(lazyDefaultConfig.EXERCISES_PATH, { recursive: true });
    await copy("tests/testdata/exercises", lazyDefaultConfig.EXERCISES_PATH);
  });
  const app = await bench("construct app", async () => {
    return await constructApp(lazyDefaultConfig);
  });
  async function request() {
    return await superoak(app.app.handle.bind(app));
  }

  const e2eCtx = { request, app };
  await t.step("e2e", async (t) => {
    await initE2eTests(t, e2eCtx);
    await t.step("role", async (t) => {
      const roleCtx = await bench("init roles", () => initRole(e2eCtx));
      await initRoleTests(t, roleCtx);
      await wrapper(t, roleCtx, "team", initTeamTests);
      await wrapper(t, roleCtx, "user", initUserTests);
      await wrapper(t, roleCtx, "problem", initProblemTests);
      await wrapper(t, roleCtx, "hierarchy", initHierarchyTests);
      await wrapper(t, roleCtx, "subject", initSubjectTests);
    });
  });

  await app.dropDb();
  app.dropExercises();
  app.closeDb();
});
