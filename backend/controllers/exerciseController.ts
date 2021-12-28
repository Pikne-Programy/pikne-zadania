import { httpErrors, RouterContext, Router } from "../deps.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { SubjectRepository, ExerciseRepository } from "../repositories/mod.ts";
import {
  IAuthorizer,
  controller,
  isAssigneeOf,
  isPermittedToView,
} from "../core/mod.ts";

export function ExerciseController(
  authorize: IAuthorizer,
  subjectRepository: SubjectRepository,
  exerciseRepository: ExerciseRepository
) {
  const list = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { subject } }) => {
      const user = await authorize(ctx); //Unauthorized shouldn't see exercises not listed in hierarchy

      if (
        !isPermittedToView(await subjectRepository.getOrFail(subject), user)
      ) {
        throw new httpErrors["Forbidden"]();
      }

      const exercises = exerciseRepository
        .listExercises(subject)
        .map((id) => ({
          id,
          exercise: exerciseRepository.getOrFail(subject, id),
        }))
        .map(({ id, exercise: { type, name, description } }) => ({
          id,
          type: type,
          name: name,
          description: description,
        }));

      ctx.response.body = { exercises };
    },
  });
  const add = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        content: exerciseSchema.content,
      },
    },
    handle: async (
      ctx: RouterContext,
      { body: { subject, exerciseId, content } }
    ) => {
      const user = await authorize(ctx);

      if (!isAssigneeOf(await subjectRepository.get(subject), user)) {
        throw new httpErrors["Forbidden"]();
      }

      await exerciseRepository.add(subject, exerciseId, content);
    },
  });

  const get = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { subject, exerciseId } }) => {
      const user = await authorize(ctx);

      if (!isAssigneeOf(await subjectRepository.get(subject), user)) {
        throw new httpErrors["Forbidden"]();
      }

      const content = await exerciseRepository.getContent(subject, exerciseId);

      ctx.response.body = { content };
    },
  });

  const update = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        content: exerciseSchema.content,
      },
    },
    status: 200,
    handle: async (
      ctx: RouterContext,
      { body: { subject: subjectId, exerciseId, content } }
    ) => {
      const user = await authorize(ctx);
      const subject = await subjectRepository.get(subjectId);

      if (!isAssigneeOf(subject, user)) {
        throw new httpErrors["Forbidden"]();
      }

      await exerciseRepository.update(subject!.id, exerciseId, content);
    },
  });

  const preview = controller({
    schema: {
      body: {
        content: exerciseSchema.content,
        seed: userSchema.seedDefault,
      },
    },
    status: 200,
    handle: (ctx: RouterContext, { body: { content, seed } }) => {
      // TODO: is it ok???
      const exercise = exerciseRepository.parse(content);

      ctx.response.body = {
        ...exercise.render(seed),
        correctAnswer: exercise.getCorrectAnswer(seed),
      };
    },
  });

  return new Router({
    prefix: "/subject/exercise",
  })
    .post("/list", list)
    .post("/add", add)
    .post("/get", get)
    .post("/update", update)
    .post("/preview", preview);
}
