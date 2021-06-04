// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export type JSONType =
  | string
  | number
  | { [key: string]: JSONType }
  | JSONType[]
  | boolean
  | null;
// export type YAMLType = JSONType;

export function isArrayOf<T>(
  how: (x: unknown) => x is T,
  what: unknown,
): what is T[] {
  return Array.isArray(what) && what.every(how);
}
export function isObjectOf<T>(
  how: (x: unknown) => x is T,
  what: unknown,
): what is { [key: string]: T } {
  return typeof what === "object" && what != null &&
    Reflect.ownKeys(what).length == Object.keys(what).length &&
    Object.values(what).every((v) => how(v));
}
export function isJSONType(what: unknown): what is JSONType {
  return (["string", "number", "boolean"].includes(typeof what)) ||
    isObjectOf(isJSONType, what) || isArrayOf(isJSONType, what) ||
    (what === null);
}
