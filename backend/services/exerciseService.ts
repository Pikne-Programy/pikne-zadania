// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { JSONObject, JSONType } from "../types/mod.ts";
import { User } from "../models/mod.ts";
import { ExerciseRepository } from "../repositories/mod.ts";

interface RenderResult {
  type: string;
  name: string;
  done: number;
  problem: JSONObject;
  correctAnswer: JSONObject;
}

type UserOrSeed = User | { seed: number };
export class ExerciseService {
  constructor(private exerciseRepository: ExerciseRepository) {}

  private getExercise(
    input: { content: string } | { subject: string; exerciseId: string }
  ) {
    return "exerciseId" in input
      ? this.exerciseRepository.get(input.subject, input.exerciseId)
      : this.exerciseRepository.parse(input.content);
  }
  private getSeed(userOrSeed: UserOrSeed) {
    return typeof userOrSeed.seed === "number"
      ? Promise.resolve(userOrSeed.seed)
      : userOrSeed.seed.get().then((seed) => seed ?? 0);
  }

  async render(
    input: { content: string },
    userOrSeed: UserOrSeed
  ): Promise<RenderResult>;
  async render(
    input: { subject: string; exerciseId: string },
    userOrSeed: UserOrSeed
  ): Promise<RenderResult>;
  async render(
    input: { content: string } | { subject: string; exerciseId: string },
    userOrSeed: UserOrSeed
  ): Promise<RenderResult> {
    const exercise = this.getExercise(input);
    const seed = await this.getSeed(userOrSeed);

    return {
      ...exercise.render(seed),
      done: 0,
      correctAnswer: exercise.getCorrectAnswer(seed),
    };
  }

  async check(
    input: { content: string } | { subject: string; exerciseId: string },
    answer: JSONType,
    user: User | { seed: number }
  ) {
    const exercise = this.getExercise(input);

    const result = exercise.check(await this.getSeed(user), answer);

    if ("exercises" in user && "exerciseId" in input) {
      await user.exercises.set(input.exerciseId, result.done);
    }

    return result;
  }
}
