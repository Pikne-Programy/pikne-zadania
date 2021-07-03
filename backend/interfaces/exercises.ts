// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  Exercise,
  isArrayOf,
  isObjectOf,
  JSONObject,
  JSONType,
  UserType,
} from "../types/mod.ts";

export type Section = {
  name: string;
  children: Section[] | string;
};
export type DoneSection = Section & {
  done?: number | null;
};
export interface YAMLSection {
  // we assume that there is only one key, feel free to tell TypeScript that
  [key: string]: (YAMLSection | string)[];
}
export function isYAMLSection(what: unknown): what is YAMLSection {
  const isYAMLSectionOrString = (x: unknown): x is (YAMLSection | string) =>
    typeof x === "string" || isYAMLSection(x);
  const isArrayOfYAMLSectionOrString = (
    e: unknown,
  ): e is (YAMLSection | string)[] => isArrayOf(isYAMLSectionOrString, e);
  return isObjectOf(isArrayOfYAMLSectionOrString, what) &&
    Object.keys(what).length == 1;
}
export interface IExercises {
  analyze(content: string): Exercise;
  getStaticContentPath(subject: string): string;
  getListOf(user: UserType | null): DoneSection[];
  check(
    id: string,
    answer: JSONType,
    user: UserType | { seed: number },
  ): Promise<JSONType | null>;
  render(id: string, seed: number): JSONObject | null;
}
