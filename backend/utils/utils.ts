// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { writeAllSync } from "../deps.ts";
import { CustomDictError } from "../types/mod.ts";

export function get(type: "string", key: string, def?: string): string;
export function get(type: "number", key: string, def?: number): number;
export function get(type: "boolean", key: string, def?: boolean): boolean;
export function get(
  type: "string" | "number" | "boolean",
  key: string,
  def?: string | number | boolean,
): string | number | boolean {
  const env = Deno.env.get(key) ?? def;
  let x;
  switch (type) {
    case "string":
      x = env;
      break;
    case "number":
      x = +(env ?? NaN);
      if (isNaN(x)) x = null;
      break;
    case "boolean":
      x = (typeof env == "string")
        ? ["true", "yes", "1"].includes(env.toLocaleLowerCase())
        : env;
      break;
  }
  if (x == null) throw new Error(`${key} must be present`);
  return x;
}

const te = new TextEncoder();
export function writeStdout(x: string) {
  writeAllSync(Deno.stdout, te.encode(x));
}

export function flushStdoutToBeginning() {
  writeStdout("\n\x1b[A");
}

export function deepCopy<T>(arr: T): T {
  return JSON.parse(JSON.stringify(arr));
}

export function handleThrown(e: unknown, msg?: string) {
  if (msg) console.error("-------", msg);
  if (e instanceof CustomDictError) console.trace(e.message, e.info, e.stack);
  else if (e instanceof Error) console.trace(e.message, e.stack);
  else if (e instanceof ErrorEvent) console.trace("ErrorEvent:", e);
  else console.trace("UNDEFINED ERROR:", e);
}

export function assertUnreachable(_: never): never {
  throw new Error("we reached the unreachable");
}
