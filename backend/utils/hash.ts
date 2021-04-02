// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-License-Identifier: WTFPL

import { createHash, hashSync as secondhash, pbkdf2Sync } from "../deps.ts";

function bufferToHex(buffer: ArrayBuffer) {
  // SRC: https://stackoverflow.com/a/50767210/6732111
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export const sha256 = (data: string, salt = "") =>
  bufferToHex(createHash("sha256").update(salt + data).digest());

export const firsthash = (user: string, password: string) =>
  btoa(
    String.fromCharCode(
      ...new Uint8Array(pbkdf2Sync(password, user, 1e6, 256 / 8, "sha512")),
    ),
  ); // SRC: https://gist.github.com/Nircek/bf06c93f8df36bf645534c10eb6305ca
export { secondhash };
export const userhash = (mail: string) =>
  sha256(mail, "some-temporary-secret:");

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
