// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { JSONType } from "./primitives.ts";
export abstract class Exercise {
  public abstract readonly type: string; // EqEx
  constructor(
    readonly name: string, // Pociągi dwa 2
    _content: string, // pociągi-dwa
    readonly properties: { [key: string]: JSONType }, // tags: kinematyka
  ) {}
  abstract render(seed: number): JSONType; // GET
  abstract check(seed: number, answer: JSONType): JSONType; // POST
}
