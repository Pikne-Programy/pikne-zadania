// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export function deepCopy<T>(arr: T): T {
  return JSON.parse(JSON.stringify(arr));
}

export function handleThrown(e: unknown, msg?: string) {
  if (msg) console.error("-------", msg);
  if (e instanceof Error) console.trace(e.message, e.stack);
  if (e instanceof ErrorEvent) console.trace("ErrorEvent:", e);
  else console.trace("UNDEFINED ERROR:", e);
}

export function assertUnreachable(_: never): never {
  throw new Error("we reached the unreachable");
}
