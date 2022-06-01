// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { rgb8, superoak } from "../test_deps.ts";
import { Await } from "../types/mod.ts";
import { constructApp } from "../app.ts";

export async function bench<T>(name: string, fn: () => T | Promise<T>) {
  const x0 = performance.now();
  const r = await fn();
  const x1 = performance.now();
  const time = rgb8("(" + Math.trunc(x1 - x0).toString() + "ms)", 245);
  console.log(name, "...", time);
  return r;
}

export interface E2eTestContext {
  request: () => ReturnType<typeof superoak>;
  app: Await<ReturnType<typeof constructApp>>;
}
export interface RoleTestContext extends E2eTestContext {
  roles: {
    root: string;
    teacher: string;
    teacher2: string;
    student: string;
    student2: string;
  };
}
