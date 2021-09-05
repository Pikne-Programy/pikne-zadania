// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Await } from "../types/mod.ts";
import { constructApp } from "../app.ts";
import { copy, superoak, TestSuite } from "../test_deps.ts";
import { lazyDefaultConfig } from "./testdata/config.ts";

export interface E2eSuiteContext {
  /** guts */ g: Await<ReturnType<typeof constructApp>>;
  request(): ReturnType<typeof superoak>;
}
export const e2eSuite = new TestSuite<E2eSuiteContext>({
  name: "e2e",
  async beforeAll(context) {
    await Deno.remove(lazyDefaultConfig.EXERCISES_PATH, { recursive: true });
    await copy("tests/testdata/exercises", lazyDefaultConfig.EXERCISES_PATH);
    context.g = await constructApp(lazyDefaultConfig);
    context.request = async function request() {
      const app = this.g.app;
      return await superoak(app.handle.bind(app));
    };
  },

  async afterAll(context) {
    await context.g.dropDb();
    context.g.dropExercises();
    context.g.closeDb();
  },
});
