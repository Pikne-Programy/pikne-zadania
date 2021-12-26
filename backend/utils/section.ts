// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isObject } from "../utils/mod.ts";

type SubSection = {
  name: string;
  children: Section[];
};
export type Section = SubSection | { children: string };

export const isSubSection = (what: Section): what is SubSection =>
  typeof what.children !== "string";

export function makeSection(
  what: unknown,
  errorCallback: () => never
): Section {
  if (!isObject(what)) {
    errorCallback();
  }
  if (!("children" in what)) {
    errorCallback();
  }
  if (typeof what.children === "string") {
    const { children } = what;
    return { children };
  }
  if (typeof what.name !== "string") {
    errorCallback();
  }
  const { name, children } = what;
  if (!Array.isArray(children)) {
    errorCallback();
  }
  return {
    name,
    children: children.map((e) => makeSection(e, errorCallback)),
  };
}
