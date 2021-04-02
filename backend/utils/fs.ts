// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { _normalize, common, join } from "../deps.ts";

export const normalize = (x: string) => _normalize(x + "/");

export function joinThrowable(
  base: string,
  ...path: string[]
): string {
  if (path.length) {
    const requested = join(base, path[0]);
    const commonPath = common([join(base), requested]);
    if (normalize(commonPath) == normalize(base)) {
      return joinThrowable(requested, ...path.slice(1));
    }
    throw new Deno.errors.PermissionDenied(
      `${base}, ${requested}, ${commonPath}`,
    );
  } else {
    return base;
  }
}

export function fileExists(path: string): boolean {
  try {
    const stat = Deno.statSync(path);
    return stat && stat.isFile;
  } catch (error) {
    if (error && error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error; // throwable
    }
  }
}
