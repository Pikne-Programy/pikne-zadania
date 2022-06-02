// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assertEquals, copy, superoak } from "../test_deps.ts";
import { constructApp } from "../app.ts";
import { data, lazyDefaultConfig } from "./testdata/config.ts";
import { bench } from "./smoke_mod.ts";
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
import { initHierarchyTests } from "./smoke_23_hierarchy.ts";
import { initProblemTests } from "./smoke_24_problem.ts";
import { initSubjectTests } from "./smoke_25_subject.ts";

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
      const roleCtx = await bench("init roles", async () => {
        const root = await login(e2eCtx, data.root);
        await updateTeamInvitation(e2eCtx, root, 1, data.teacher.invitation);
        await register(e2eCtx, data.teacher);
        const teacher = await login(e2eCtx, data.teacher);
        await register(e2eCtx, data.teacher2);
        const teacher2 = await login(e2eCtx, data.teacher2);
        assertEquals(await createTeam(e2eCtx, teacher, "2d"), 2);
        await updateTeamInvitation(e2eCtx, teacher, 2, data.student.invitation);
        await register(e2eCtx, data.student);
        const student = await login(e2eCtx, data.student);
        await register(e2eCtx, data.student2);
        const student2 = await login(e2eCtx, data.student2);
        return {
          ...e2eCtx,
          roles: { root, teacher, teacher2, student, student2 },
        };
      });
      await initRoleTests(t, roleCtx);
      await t.step("team", async (t) => await initTeamTests(t, roleCtx));
      await t.step("user", async (t) => await initUserTests(t, roleCtx));
      await t.step("hierarchy", async (t) => {
        await initHierarchyTests(t, roleCtx);
      });
      await t.step("problem", async (t) => await initProblemTests(t, roleCtx));
      await t.step("subject", async (t) => await initSubjectTests(t, roleCtx));
    });
  });

  await app.dropDb();
  app.dropExercises();
  app.closeDb();
});
