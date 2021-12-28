// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { generateSeed } from "../utils/mod.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { User } from "../models/mod.ts";
import { ConfigService } from "../services/mod.ts";
import {
  SubjectRepository,
  UserRepository,
  ExerciseRepository,
} from "../repositories/mod.ts";
import {
  IAuthorizer,
  controller,
  isAssigneeOf,
  isPermittedToView,
} from "../core/mod.ts";

//FIXME name
const problemGetSeed = (
  ctx: RouterContext,
  seed: number | null,
  maxAge: number,
  user?: User
) => {
  const go = () => {
    if (user) {
      return seed !== null && user.isTeacher() ? { seed } : user;
    }

    const _seed = ctx.cookies.get("seed") ?? `${generateSeed()}`;

    ctx.cookies.set("seed", _seed, { maxAge });

    return { seed: +_seed };
  };

  return go()?.seed ?? 0;
};

export function ProblemController(
  authorize: IAuthorizer,
  config: ConfigService,
  subjectRepository: SubjectRepository,
  exerciseRepository: ExerciseRepository,
  userRepository: UserRepository
) {
  const get = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        seed: userSchema.seedOptional,
      },
    },
    status: 200,
    handle: async (
      ctx: RouterContext,
      { body: { subject: subjectId, exerciseId, seed: _seed } }
    ) => {
      const user = await authorize(ctx, false);
      const subject = await subjectRepository.getOrFail(subjectId);

      if (!isPermittedToView(subject, user)) {
        throw new httpErrors["Forbidden"]();
      }

      const exercise = exerciseRepository.getOrFail(subject!.id, exerciseId);
      const seed = problemGetSeed(ctx, _seed, config.SEED_AGE, user);

      const parsed = {
        ...exercise.render(seed),
        done: 0,
        correctAnswer: exercise.getCorrectAnswer(seed),
      };

      if (!isAssigneeOf(subject, user)) {
        const { correctAnswer: _correctAnswer, ...parsedCensored } = parsed;

        ctx.response.body = parsedCensored;
      } else {
        ctx.response.body = parsed;
      }
    },
  });

  const update = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        answer: exerciseSchema.answer,
      },
    },
    status: 200,
    handle: async (
      ctx: RouterContext,
      { body: { subject, exerciseId, answer } }
    ) => {
      const user = await authorize(ctx, false);

      if (
        !isPermittedToView(await subjectRepository.getOrFail(subject), user)
      ) {
        throw new httpErrors["Forbidden"]();
      }

      const seed = problemGetSeed(ctx, null, config.SEED_AGE, user);
      const exercise = exerciseRepository.getOrFail(subject, exerciseId);

      const { done, info } = exercise.check(seed, answer);

      if (user) {
        await userRepository.collection.updateOne(
          { id: user.id },
          {
            $set: { [`exercises.${exerciseId}`]: done },
          }
        );
      }
      ctx.response.body = { info }; // ? done, correctAnswer ?
    },
  });

  return new Router({
    prefix: "/subject/problem",
  })
    .post("/get", get)
    .post("/update", update);
}
