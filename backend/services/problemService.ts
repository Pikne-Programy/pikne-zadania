import {
  UserRepository,
  SubjectRepository,
  ExerciseRepository,
} from "../repositories/mod.ts";
import { User } from "../models/mod.ts";
import { httpErrors } from "../deps.ts";
import { isAssigneeOf, isPermittedToView } from "../core/mod.ts";
import { generateSeed, JSONType } from "../utils/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class ProblemService {
  constructor(
    private subjectRepository: SubjectRepository,
    private exerciseRepository: ExerciseRepository,
    private userRepository: UserRepository
  ) {}

  //FIXME all this stuff with seeds
  private getSeed = (
    cookie: string | undefined,
    seed: number | null,
    user?: User
  ) =>
    user
      ? seed !== null && user.isTeacher()
        ? seed
        : user.seed ?? 0
      : +(cookie ?? `${generateSeed()}`);

  async get(
    currentUser: User | undefined,
    {
      subject: subjectId,
      exerciseId,
      seed: _seed,
      otherSeed,
    }: {
      subject: string;
      exerciseId: string;
      seed: number | null;
      otherSeed?: string;
    }
  ) {
    const subject = await this.subjectRepository.getOrFail(subjectId);

    if (!isPermittedToView(subject, currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    const exercise = this.exerciseRepository.getOrFail(subject!.id, exerciseId);
    const seed = this.getSeed(otherSeed, _seed, currentUser);

    const response = Object.assign(
      { done: 0 },
      exercise.render(seed),
      isAssigneeOf(subject, currentUser) && {
        correctAnswer: exercise.getCorrectAnswer(seed),
      }
    );

    return {
      response,
      seed: !currentUser ? seed : null,
    };
  }

  async update(
    currentUser: User | undefined,
    {
      subject,
      exerciseId,
      answer,
      otherSeed,
    }: {
      subject: string;
      exerciseId: string;
      answer: JSONType;
      otherSeed?: string;
    }
  ) {
    if (
      !isPermittedToView(
        await this.subjectRepository.getOrFail(subject),
        currentUser
      )
    ) {
      throw new httpErrors["Forbidden"]();
    }

    const seed = this.getSeed(otherSeed, null, currentUser);

    const exercise = this.exerciseRepository.getOrFail(subject, exerciseId);

    const { done, info } = exercise.check(seed, answer);

    if (currentUser) {
      await this.userRepository.collection.updateOne(
        { id: currentUser.id },
        {
          $set: { [`exercises.${exerciseId}`]: done },
        }
      );
    }

    return {
      response: { info },
      seed: !currentUser ? seed : null,
    };
  }
}
