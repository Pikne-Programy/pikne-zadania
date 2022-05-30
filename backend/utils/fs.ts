// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { _normalize, common, join } from "../deps.ts";

export const normalize = (x: string) => _normalize(x + "/");

//FIXME name
export function joinThrowable(base: string, ...path: string[]): string {
  if (!path.length) {
    return base;
  }

  const requested = join(base, path[0]);
  const commonPath = common([join(base), requested]);

  if (normalize(commonPath) !== normalize(base)) {
    throw new Deno.errors.PermissionDenied(
      `${base}, ${requested}, ${commonPath}`,
    );
  }

  return joinThrowable(requested, ...path.slice(1));
}
