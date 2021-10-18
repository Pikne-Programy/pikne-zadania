// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assertEquals, TestSuite } from "../test_deps.ts";
import { e2eSuite, E2eSuiteContext } from "./e2e.ts";
import { data } from "./testdata/config.ts";
import {
  createTeam,
  login,
  register,
  updateTeamInvitation,
} from "./utils/user.ts";

export interface RoleSuiteContext extends E2eSuiteContext {
  roles: {
    root: string;
    teacher: string;
    teacher2: string;
    student: string;
    student2: string;
  };
}
export const roleSuite = new TestSuite<RoleSuiteContext>({
  suite: e2eSuite,
  name: "role",

  async beforeAll(context) {
    const root = await login(context, data.root);
    await updateTeamInvitation(context, root, 1, data.teacher.invitation);
    await register(context, data.teacher);
    const teacher = await login(context, data.teacher);
    await register(context, data.teacher2);
    const teacher2 = await login(context, data.teacher2);
    assertEquals(await createTeam(context, teacher, "2d"), 2);
    await updateTeamInvitation(context, teacher, 2, data.student.invitation);
    await register(context, data.student);
    const student = await login(context, data.student);
    await register(context, data.student2);
    const student2 = await login(context, data.student2);
    context.roles = { root, teacher, teacher2, student, student2 };
  },
  // TODO: logout?
});
