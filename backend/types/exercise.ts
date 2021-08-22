// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError, isArrayOf, JSONObject, JSONType } from "./mod.ts";
import { IConfigService } from "../interfaces/mod.ts";

export abstract class Exercise {
  public abstract readonly type: string;
  public abstract readonly description: string;
  constructor(
    protected cfg: IConfigService,
    readonly name: string,
    _content: string,
    readonly properties: JSONObject,
  ) {}
  abstract render(seed: number): {
    type: string;
    name: string;
    problem: JSONObject;
  };
  abstract getCorrectAnswer(seed: number): JSONObject;
  abstract check(
    seed: number,
    answer: JSONType,
  ):
    | { done: number; info: JSONType }
    | CustomDictError<"ExerciseBadAnswerFormat">;
}

export type Section = {
  name: string;
  children: Section[] | string; // id
};
function isNameChildrenObject(
  what: unknown,
): what is { name: unknown; children: unknown } {
  return typeof what === "object" && what !== null &&
    Object.keys(what).sort().toString() === "children,name";
}
export function isSection(what: unknown): what is Section {
  if (!isNameChildrenObject(what)) return false;
  if (typeof what.name !== "string") return false;
  if (typeof what.children === "string") return true;
  return isArrayOf(isSection, what.children);
}
