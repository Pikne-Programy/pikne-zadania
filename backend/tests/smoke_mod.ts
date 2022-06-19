// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assert, assertEquals, copy, rgb8, superoak } from "../test_deps.ts";
import { Await } from "../types/mod.ts";
import {
  delay,
  flushStdoutToBeginning,
  get,
  writeStdout,
} from "../utils/mod.ts";
import { constructApp } from "../app.ts";
import { data, lazyDefaultConfig } from "./testdata/config.ts";
import {
  createTeam,
  login,
  register,
  updateTeamInvitation,
} from "./utils/user.ts";

import { initE2eTests } from "./smoke_10_e2e.ts";
import { initRoleTests } from "./smoke_20_role.ts";

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

async function initRole(e2eCtx: E2eTestContext): Promise<RoleTestContext> {
  const eve = undefined as unknown as string;
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
    roles: { root, lanny, ralph, alice, bob, mike, eve },
  };
}

type TC = Deno.TestContext;
function wrapper<T>(t: TC, ctx: T, n: string, fn: (t: TC, ctx: T) => unknown) {
  return t.step(n, async (t) => {
    await fn(t, ctx);
  });
}

const selectedTests: [string, (t: TC, ctx: RoleTestContext) => unknown][] = [];
export function registerRoleTest(
  name: string,
  init: (t: TC, ctx: RoleTestContext) => unknown,
) {
  assert(!selectedTests.map((e) => e[0]).includes(name));
  selectedTests.push([name, init]);
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
      for (const [name, init] of selectedTests) {
        await wrapper(t, roleCtx, name, init);
      }
    });
  });

  await app.dropDb();
  app.dropExercises();
  app.closeDb();
});
