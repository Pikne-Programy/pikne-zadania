// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IConfigService } from "../interfaces/mod.ts";
import { isArrayOf, JSONObject, JSONType } from "./mod.ts";

export abstract class Exercise {
  public abstract readonly type: string; // EqEx
  constructor(
    protected cfg: IConfigService,
    readonly name: string, // Pociągi dwa 2
    _content: string, // pociągi-dwa
    readonly properties: JSONObject, // tags: kinematyka
  ) {}
  abstract render(seed: number): JSONObject; // GET
  abstract check(
    seed: number,
    answer: JSONType,
  ): { done: number; info: JSONType; correctAnswer: JSONType }; // POST
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
