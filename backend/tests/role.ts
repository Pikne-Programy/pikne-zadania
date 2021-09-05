// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestSuite } from "../test_deps.ts";
import { updateCookies } from "./utils/cookies.ts";
import { e2eSuite, E2eSuiteContext, getSuperAgent } from "./e2e.ts";
import { rootHashedPassword } from "./testdata/config.ts";

async function login(
  context: E2eSuiteContext,
  login: string,
  hashedPassword: string,
  old?: string,
) {
  try {
    const response = await (await getSuperAgent(context.g.app))
      .post("/api/auth/login")
      .send({ login, hashedPassword })
      .expect(200);
    return updateCookies(response, old);
  } catch (e) {
    throw new Error(`login \`${login}\` failed: ${e}`);
  }
}

export interface RoleSuiteContext extends E2eSuiteContext {
  roles: {
    root: string;
  };
}
export const roleSuite = new TestSuite<RoleSuiteContext>({
  suite: e2eSuite,
  name: "role",

  async beforeAll(context) {
    context.roles = { // TODO: add more roles
      root: await login(context, "root", rootHashedPassword),
    };
  },
  // TODO: logout?
});
