// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError, JSONType } from "../types/mod.ts";
import { IExerciseService, IExerciseStore, IUser } from "../interfaces/mod.ts";

export class ExerciseService implements IExerciseService {
  constructor(
    private ex: IExerciseStore,
  ) {}

  private getExercise(
    input: { content: string } | { subject: string; exerciseId: string },
  ) {
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
    input: { content: string } | { subject: string; exerciseId: string },
    user: IUser | { seed: number },
  ) {
    const ex = this.getExercise(input);
    if (ex instanceof CustomDictError) return ex;
    const seed = await this.getSeed(user);
    return {
      ...ex.render(seed),
      done: 0,
      correctAnswer: ex.getCorrectAnswer(seed),
    };
  }

  async check(
    input: { content: string } | { subject: string; exerciseId: string },
    answer: JSONType,
    user: IUser | { seed: number },
  ) {
    const ex = this.getExercise(input);
    if (ex instanceof CustomDictError) return ex;
    const r = ex.check(await this.getSeed(user), answer);
    if (
      !(r instanceof CustomDictError) && "exercises" in user &&
      "exerciseId" in input
    ) {
      await user.exercises.set(input.exerciseId, r.done);
    }
    return r;
  }
}
