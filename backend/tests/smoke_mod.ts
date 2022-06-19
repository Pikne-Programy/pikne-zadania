// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { rgb8, superoak } from "../test_deps.ts";
import { Await } from "../types/mod.ts";
import {
  delay,
  flushStdoutToBeginning,
  get,
  writeStdout,
} from "../utils/mod.ts";
import { constructApp } from "../app.ts";
import { data } from "./testdata/config.ts";

const LIVE_BENCH = get("boolean", "LIVE_BENCH", true);
let timing = false;
export async function stdoutTimer(prefix: string, x0: number) {
  timing = LIVE_BENCH;
  writeStdout(prefix);
  flushStdoutToBeginning();
  while (timing) {
    writeStdout(prefix);
    const delta = performance.now() - x0;
    const color = delta % 8 + 8;
    const time = rgb8(`(${Math.trunc(delta)}ms)`, color);
    writeStdout(time);
    flushStdoutToBeginning();
    await delay(0);
  }
}

export async function bench<T>(name: string, fn: () => T | Promise<T>) {
  const prefix = name + " ... ";
  const x0 = performance.now();
  const rp = fn();
  const t = stdoutTimer(prefix, x0);
  let r: Awaited<typeof rp>;
  try {
    r = await rp;
  } catch (e) {
    timing = false;
    await t;
    console.log();
    throw e;
  }
  const x1 = performance.now();
  timing = false;
  await t;
  const time = rgb8("(" + Math.trunc(x1 - x0).toString() + "ms)", 245);
  writeStdout(prefix);
  console.log(time);
  return r;
}

export function endpointFactory<
  E extends Record<K, undefined | Record<string, unknown>>,
  K extends string = keyof E & string,
>(g: RoleTestContext) {
  return async function endpoint<T extends K>(
    auth: keyof RoleTestContext["roles"],
    endpoint: T,
    data: E[T],
    extra: number | [number, unknown] = 200,
  ) {
    const cookie = g.roles[auth];
    const get = endpoint[0] === ":";
    const url = get ? endpoint.slice(1) : endpoint;
    const t = (await g.request())
      [get ? "get" : "post"](url)
      .set("Cookie", cookie)
      .send(data);
    if (typeof extra === "number") t.expect(extra);
    else t.expect(...extra);
    return (await t).body;
  };
}

export interface E2eTestContext {
  request: () => ReturnType<typeof superoak>;
  app: Await<ReturnType<typeof constructApp>>;
}
export interface RoleTestContext extends E2eTestContext {
  roles: {
    [prop in keyof (typeof data)["u"]]: string;
  };
}
