// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { JSONType } from "../utils/mod.ts";
import { User } from "../models/mod.ts";
import { ExerciseRepository, UserRepository } from "../repositories/mod.ts";

type UserOrSeed = User | { seed: number };
export class ExerciseService {
  constructor(
    private exerciseRepository: ExerciseRepository,
    private userRepository: UserRepository
  ) {}

  private getExercise(
    input: { content: string } | { subject: string; exerciseId: string }
  ) {
    return "exerciseId" in input
      ? this.exerciseRepository.get(input.subject, input.exerciseId)
      : this.exerciseRepository.parse(input.content);
  }

  render(
    input: { content: string } | { subject: string; exerciseId: string },
    userOrSeed: UserOrSeed
  ) {
    const exercise = this.getExercise(input);
    const seed = userOrSeed.seed ?? 0;

    return {
      ...exercise.render(seed),
      done: 0,
      correctAnswer: exercise.getCorrectAnswer(seed),
    };
  }

  async check(
    input: { content: string } | { subject: string; exerciseId: string },
    answer: JSONType,
    user: UserOrSeed
  ) {
    const exercise = this.getExercise(input);

    const result = exercise.check(user.seed ?? 0, answer);

    if ("exercises" in user && "exerciseId" in input) {
      await this.userRepository
        .exercisesFor(user)
        .set(input.exerciseId, result.done);
    }

    return result;
  }
}
