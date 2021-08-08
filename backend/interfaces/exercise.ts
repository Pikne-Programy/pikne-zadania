// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IUser } from "./mod.ts";
import { JSONObject, JSONType } from "../types/mod.ts";

export interface IExerciseService {
  render(
    input: { content: string } | { subject: string; id: string },
    user: IUser | { seed: number },
  ): Promise<JSONObject | null>;
  check(
    input: { content: string } | { subject: string; id: string },
    answer: JSONType,
    user: IUser | { seed: number },
  ): Promise<{ done: number; info: JSONType; correctAnswer: JSONType } | null>;
}
