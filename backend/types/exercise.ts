// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { JSONObject, JSONType } from "./primitives.ts";
export abstract class Exercise {
  public abstract readonly type: string; // EqEx
  constructor(
    readonly name: string, // Pociągi dwa 2
    _content: string, // pociągi-dwa
    readonly properties: JSONObject, // tags: kinematyka
  ) {}
  abstract render(seed: number): JSONObject; // GET
  abstract check(
    seed: number,
    answer: JSONType,
  ): { done: number; answer: JSONType }; // POST
}
