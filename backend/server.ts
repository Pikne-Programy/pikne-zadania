// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later
import { createApp } from "./app.ts";
import { countdown } from "./utils/mod.ts";

const { app, closeDb, logger } = await createApp();

const abortController = new AbortController();

Deno.build.os !== "windows" &&
  Promise.race([
    // this will not be executed in the development environment
    // see https://github.com/denosaurs/denon/issues/126
    // Deno.signal(Deno.Signal.SIGKILL),
    Deno.signal(Deno.Signal.SIGINT),
    Deno.signal(Deno.Signal.SIGQUIT),
    Deno.signal(Deno.Signal.SIGTERM),
  ])
    .then(() => {
      logger.log("The server is closing...");

      abortController.abort();
      closeDb();
    })
    .then(() => countdown(5))
    .finally(Deno.exit);

await app.listen({ port: 8000, signal: abortController.signal });

logger.log("Oak server closed.");
