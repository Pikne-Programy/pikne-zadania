// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Application, HttpError } from "./deps.ts";
import router from "./router.ts";
import { closeDB, Context, handleThrown, State } from "./utils/mod.ts";

const app = new Application<State>();

app.addEventListener("error", handleThrown);

function die(ctx: Context, status = 500, msg = "") {
  ctx.response.status = status;
  ctx.response.body = { status, msg };
}

app.use(async (ctx: Context, next: () => unknown) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) die(ctx, e.status, e.message);
    else {
      die(ctx, 500, e instanceof Error ? e.message : "");
      handleThrown(e);
    }
  } finally {
    const id = ctx.state.user ? ctx.state.user.id : "null";
    console.log(
      ctx.request.method,
      ctx.request.url.pathname,
      id,
      ctx.response.status,
    );
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", () => console.log("Server started"));

const abortController = new AbortController();
const { signal } = abortController;

function countdown(seconds: number): Promise<void> {
  if (seconds) {
    Deno.stdout.writeSync(new Uint8Array([126]));
    return new Promise((r) =>
      setTimeout(() => countdown(seconds - 1).then(r), 1e3)
    );
  }
  Deno.stdout.writeSync(new Uint8Array([10]));
  return new Promise((r) => r());
}

Promise.race([
  // this will not be executed in the development environment
  // see https://github.com/denosaurs/denon/issues/126
  // Deno.signal(Deno.Signal.SIGKILL),
  Deno.signal(Deno.Signal.SIGINT),
  Deno.signal(Deno.Signal.SIGQUIT),
  Deno.signal(Deno.Signal.SIGTERM),
]).then(() => {
  console.log("The server is closing...");
  abortController.abort();
  closeDB();
}).then(() => countdown(5)).finally(Deno.exit);

await app.listen({ port: 8000, signal });
console.log("Oak server closed.");
