// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError, JSONObject, JSONType } from "../types/mod.ts";
import { IUser } from "./mod.ts";

export interface IExerciseService {
  render(input: { content: string }, user: IUser | { seed: number }): Promise<
    {
      type: string;
      name: string;
      done: number | null;
      problem: JSONObject;
      correctAnswer: JSONObject;
    } | CustomDictError<"ExerciseBadFormat">
  >;
  render(
    input: { subject: string; exerciseId: string },
    user: IUser | { seed: number },
  ): Promise<
    {
      type: string;
      name: string;
      done: number | null;
      problem: JSONObject;
      correctAnswer: JSONObject;
    } | CustomDictError<"ExerciseNotFound">
  >;
  render(
    input: { content: string } | { subject: string; exerciseId: string },
    user: IUser | { seed: number },
    offset?: number,
  ): Promise<
    {
      type: string;
      name: string;
      done: number | null;
      problem: JSONObject;
      correctAnswer: JSONObject;
    } | CustomDictError<"ExerciseBadFormat" | "ExerciseNotFound">
  >;
  check(
    input: { content: string } | { subject: string; exerciseId: string },
    answer: JSONType,
    user: IUser | { seed: number },
    offset?: number,
  ): Promise<
    | { done: number; info: JSONType }
    | CustomDictError<
      "ExerciseBadFormat" | "ExerciseBadAnswerFormat" | "ExerciseNotFound"
    >
  >;
}
