// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export const deepCopy = <T>(arr: T): T => JSON.parse(JSON.stringify(arr));

export function assertUnreachable(_: never): never {
  throw new Error("we reached the unreachable");
}

export function countdown(seconds: number): Promise<void> {
  if (seconds) {
    Deno.stdout.writeSync(new Uint8Array([126]));
    return new Promise((r) =>
      setTimeout(() => countdown(seconds - 1).then(r), 1e3)
    );
  }
  Deno.stdout.writeSync(new Uint8Array([10]));
  return new Promise((r) => r());
}
