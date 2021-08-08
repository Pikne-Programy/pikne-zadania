// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IExerciseService, IExerciseStore } from "../interfaces/mod.ts";
import { IUser } from "../interfaces/user.ts";
import { JSONType } from "../types/mod.ts";

export class ExerciseService implements IExerciseService {
  constructor(
    private ex: IExerciseStore,
  ) {}

  private getExercise(
    input: { content: string } | { subject: string; id: string },
  ) {
    return "id" in input
      ? this.ex.get(input.subject, input.id)
      : this.ex.parse(input.content);
  }
  private async getSeed(user: IUser | { seed: number }) {
    return typeof user.seed === "number"
      ? user.seed
      : await user.seed.get() ?? 0;
  }

  async render(
    input: { content: string } | { subject: string; id: string },
    user: IUser | { seed: number },
  ) {
    const ex = this.getExercise(input);
    if (ex === null) return null;
    return ex.render(await this.getSeed(user));
  }

  async check(
    input: { content: string } | { subject: string; id: string },
    answer: JSONType,
    user: IUser | { seed: number },
  ) {
    const ex = this.getExercise(input);
    if (ex === null) return null;
    const r = ex.check(await this.getSeed(user), answer);
    if ("exercises" in user && "id" in input) {
      await user.exercises.set(input.id, r.done);
    }
    return r;
  }
}
