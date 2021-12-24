// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isArrayOf, isObject, JSONObject, JSONType } from "./mod.ts";
import { ConfigService } from "../services/mod.ts";

export abstract class Exercise {
  //FIXME interface maybe?
  public abstract readonly type: string;
  public abstract readonly description: string;
  constructor(
    protected config: ConfigService,
    readonly name: string,
    _content: string,
    readonly properties: JSONObject
  ) {}
  abstract render(seed: number): {
    type: string;
    name: string;
    problem: JSONObject;
  };
  abstract getCorrectAnswer(seed: number): JSONObject;
  /**
   * @throws {CustomDictError<"ExerciseBadAnswerFormat">}
   */
  abstract check(
    seed: number,
    answer: JSONType
  ): { done: number; info: JSONType };
}

type SubSection = {
  name: string;
  children: Section[];
};
export type Section = SubSection | { children: string };

export function isSection(what: unknown): what is Section {
  if (!isObject(what)) {
    return false;
  }
  if (typeof what.children === "string") {
    return true;
  }
  return (
    typeof what.name === "string" &&
    what.name !== "" &&
    isArrayOf(isSection, what.children)
  );
}
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
