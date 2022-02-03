import {
  ExerciseRepository,
  SubjectRepository,
  UserRepository,
} from "../repositories/mod.ts";
import { Guest, User, UserRoles } from "../models/mod.ts";
import { generateSeed, JSONType } from "../utils/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";
import { Actions, isUser } from "../common/mod.ts";

@Injectable()
export class ProblemService {
  constructor(
    private subjectRepository: SubjectRepository,
    private exerciseRepository: ExerciseRepository,
    private userRepository: UserRepository,
  ) {}

  private getSeed = (
    cookie: string | undefined,
    seed: number | null,
    user: User | Guest,
  ) =>
    isUser(user)
      ? seed !== null &&
          (user.role === UserRoles.ADMIN || user.role === UserRoles.TEACHER)
        ? seed
        : user.seed ?? 0
      : +(cookie ?? `${generateSeed()}`);

  async get(
    currentUser: User | Guest,
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
    },
  ) {
    const subject = await this.subjectRepository.getOrFail(subjectId);

    currentUser.assertCan(Actions.READ, subject);

    const exercise = this.exerciseRepository.getOrFail(subject.id, exerciseId);
    const seed = this.getSeed(otherSeed, _seed, currentUser);

    const response = Object.assign(
      { done: 0 },
      exercise.render(seed),
      currentUser.can(Actions.READ_CORRECT_ANSWER, subject) && {
        correctAnswer: exercise.getCorrectAnswer(seed),
      },
    );

    return {
      response,
      seed: !isUser(currentUser) ? seed : null,
    };
  }

  async update(
    currentUser: User | Guest,
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
    },
  ) {
    currentUser.assertCan(
      Actions.UPDATE_PROBLEM,
      await this.subjectRepository.getOrFail(subject),
    );

    const seed = this.getSeed(otherSeed, null, currentUser);

    const exercise = this.exerciseRepository.getOrFail(subject, exerciseId);

    const { done, info } = exercise.check(seed, answer);

    if (isUser(currentUser)) {
      await this.userRepository.collection.updateOne(
        { id: currentUser.id },
        {
          $set: { [`exercises.${exerciseId}`]: done },
        },
      );
    }

    return {
      response: { info },
      seed: !isUser(currentUser) ? seed : null,
    };
  }
}
