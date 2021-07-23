// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { User } from "../models/user.ts";
import { JSONObject, JSONType } from "../types/mod.ts";

export interface IExerciseService {
  render(
    input: { content: string } | { id: string },
    user: User | { seed: number },
  ): JSONObject | null;
  check(
    input: { content: string } | { id: string },
    answer: JSONType,
    user: User | { seed: number },
  ): { done: number; info: JSONType; correctAnswer: JSONType };
}
