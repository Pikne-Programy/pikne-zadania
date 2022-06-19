// Copyright 2021-2022 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  CustomDictError,
  Exercise,
  JSONObject,
  JSONType,
} from "../types/mod.ts";
import { IExerciseService, IExerciseStore, IUser } from "../interfaces/mod.ts";

export class ExerciseService implements IExerciseService {
  constructor(
    private ex: IExerciseStore,
  ) {}

  private getExercise(
    input: { content: string } | { subject: string; exerciseId: string },
  ): Exercise | CustomDictError<"ExerciseBadFormat" | "ExerciseNotFound"> {
    return "exerciseId" in input
      ? this.ex.get(input.subject, input.exerciseId)
      : this.ex.parse(input.content);
  }
  private async getSeed(user: IUser | { seed: number }) {
    return typeof user.seed === "number"
      ? user.seed
      : await user.seed.get() ?? 0;
  }

  async render(
    input: { content: string },
    user: IUser | { seed: number },
  ): Promise<
    {
      type: string;
      name: string;
      done: number | null;
      problem: JSONObject;
      correctAnswer: JSONObject;
    } | CustomDictError<"ExerciseBadFormat">
  >;
  async render(
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
  async render(
    input: { content: string } | { subject: string; exerciseId: string },
    user: IUser | { seed: number }, offset?: number
  ): Promise<
    {
      type: string;
      name: string;
      done: number | null;
      problem: JSONObject;
      correctAnswer: JSONObject;
    } | CustomDictError<"ExerciseBadFormat" | "ExerciseNotFound">
  > {
    const ex = this.getExercise(input);
    if (ex instanceof CustomDictError) return ex;
    const seed = await this.getSeed(user) + (offset ?? 0);
    return {
      ...ex.render(seed),
      correctAnswer: ex.getCorrectAnswer(seed),
      done: "exercises" in user && "exerciseId" in input
        ? await user.exercises.get(
          this.ex.uid(input.subject, input.exerciseId),
        ) ?? null
        : null,
    };
  }

  async check(
    input: { content: string } | { subject: string; exerciseId: string },
    answer: JSONType,
    user: IUser | { seed: number },
    offset?: number
  ) {
    const ex = this.getExercise(input);
    if (ex instanceof CustomDictError) return ex;
    const r = ex.check(await this.getSeed(user), answer, offset ?? 0);
    if (
      !(r instanceof CustomDictError) && "exercises" in user &&
      "exerciseId" in input
    ) {
      await user.exercises.set(
        this.ex.uid(input.subject, input.exerciseId),
        r.done,
      );
    }
    return r;
  }
}
