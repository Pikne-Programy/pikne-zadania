// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later
import { flushStdoutToBeginning, writeStdout } from "./utils/mod.ts";
import { constructApp } from "./app.ts";

const { app, closeDb, cfg } = await constructApp();

const abortController = new AbortController();
const { signal } = abortController;

function countdown(seconds: number, i = 1): Promise<void> {
  writeStdout("~".repeat(i) + "-".repeat(seconds - i));
  if (i != seconds) {
    flushStdoutToBeginning();
    return new Promise((r) =>
      setTimeout(() => countdown(seconds, i + 1).then(r), 1e3)
    );
  }
  writeStdout("\n");
  return new Promise((r) => r());
}

const sigHandler = async () => {
  try {
    if (cfg.VERBOSITY >= 3) {
      console.log("The server is closing...");
    }
    abortController.abort();
    closeDb();
    await countdown(5);
  } finally {
    Deno.exit();
  }
};

Deno.addSignalListener("SIGINT", sigHandler);
Deno.addSignalListener("SIGTERM", sigHandler);
Deno.addSignalListener("SIGQUIT", sigHandler);

await app.listen({ port: 8000, signal });
if (cfg.VERBOSITY >= 3) {
  console.log("Oak server closed.");
}
