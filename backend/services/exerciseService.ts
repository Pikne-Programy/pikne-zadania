import { User } from "../models/mod.ts";
import { ExerciseRepository, SubjectRepository } from "../repositories/mod.ts";
import { Actions } from "../common/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class ExerciseService {
  constructor(
    private subjectRepository: SubjectRepository,
    private exerciseRepository: ExerciseRepository,
  ) {}

  async findOne(
    currentUser: User,
    { subject, exerciseId }: { subject: string; exerciseId: string },
  ) {
    currentUser.assertCan(
      Actions.READ,
      await this.subjectRepository.getOrFail(subject),
    );

    const content = await this.exerciseRepository.getContent(
      subject,
      exerciseId,
    );

    return { content };
  }

  async findAll(currentUser: User, { subject }: { subject: string }) {
    currentUser.assertCan(
      Actions.READ,
      await this.subjectRepository.getOrFail(subject),
    );

    const exercises = this.exerciseRepository
      .listExercises(subject)
      .map((id) => ({
        id,
        exercise: this.exerciseRepository.getOrFail(subject, id),
      }))
      .map(({ id, exercise: { type, name, description } }) => ({
        id,
        type: type,
        name: name,
        description: description,
      }));

    return { exercises };
  }

  async create(
    currentUser: User,
    {
      subject,
      exerciseId,
      content,
    }: { subject: string; exerciseId: string; content: string },
  ) {
    currentUser.assertCan(
      Actions.CREATE,
      await this.subjectRepository.getOrFail(subject),
    );

    await this.exerciseRepository.add(subject, exerciseId, content);
  }

  async update(
    currentUser: User,
    {
      subject: subjectId,
      exerciseId,
      content,
    }: { subject: string; exerciseId: string; content: string },
  ) {
    const subject = await this.subjectRepository.getOrFail(subjectId);

    currentUser.assertCan(Actions.UPDATE, subject);

    await this.exerciseRepository.update(subject.id, exerciseId, content);
  }

  preview({ content, seed }: { content: string; seed: number }) {
    // TODO: is it ok???
    const exercise = this.exerciseRepository.parse(content);
    return {
      ...exercise.render(seed),
      correctAnswer: exercise.getCorrectAnswer(seed),
    };
  }
}
