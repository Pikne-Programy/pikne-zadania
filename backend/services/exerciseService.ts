import { User } from "../models/mod.ts";
import { SubjectRepository, ExerciseRepository } from "../repositories/mod.ts";
import { isAssigneeOf, isPermittedToView } from "../core/mod.ts";
import { httpErrors } from "../deps.ts";

export class ExerciseService {
  constructor(
    private subjectRepository: SubjectRepository,
    private exerciseRepository: ExerciseRepository
  ) {}

  async findOne(
    currentUser: User,
    { subject, exerciseId }: { subject: string; exerciseId: string }
  ) {
    if (!isAssigneeOf(await this.subjectRepository.get(subject), currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    const content = await this.exerciseRepository.getContent(
      subject,
      exerciseId
    );

    return { content };
  }

  async findAll(currentUser: User, { subject }: { subject: string }) {
    if (
      !isPermittedToView(
        await this.subjectRepository.getOrFail(subject),
        currentUser
      )
    ) {
      throw new httpErrors["Forbidden"]();
    }

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
    }: { subject: string; exerciseId: string; content: string }
  ) {
    if (!isAssigneeOf(await this.subjectRepository.get(subject), currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    await this.exerciseRepository.add(subject, exerciseId, content);
  }

  async update(
    currentUser: User,
    {
      subject: subjectId,
      exerciseId,
      content,
    }: { subject: string; exerciseId: string; content: string }
  ) {
    const subject = await this.subjectRepository.get(subjectId);

    if (!isAssigneeOf(subject, currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    await this.exerciseRepository.update(subject!.id, exerciseId, content);
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
