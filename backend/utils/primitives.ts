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
export type JSONObject = { [key: string]: JSONType };

export const isArrayOf = <T>(
  how: (x: unknown) => x is T,
  what: unknown,
): what is T[] => Array.isArray(what) && what.every(how);

export const isObjectOf = <T>(
  how: (x: unknown) => x is T,
  what: unknown,
): what is { [key: string]: T } =>
  typeof what === "object" &&
  what != null &&
  Reflect.ownKeys(what).length == Object.keys(what).length &&
  Object.values(what).every((v) => how(v));

export const isObject = (what: unknown): what is Record<string, unknown> =>
  isObjectOf((_: unknown): _ is unknown => true, what);

export const isJSONType = (what: unknown): what is JSONType =>
  ["string", "number", "boolean"].includes(typeof what) ||
  isObjectOf(isJSONType, what) ||
  isArrayOf(isJSONType, what) ||
  what === null;
