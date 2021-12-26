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
  const listExercise = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { subject } }) => {
      const user = await authorize(ctx); //Unauthorized shouldn't see exercises not listed in hierarchy

      if (!(await isPermittedToView(subjectRepository.get(subject), user))) {
        throw new httpErrors["Forbidden"]();
      }

      const exercises = exerciseRepository
        .listExercises(subject)
        .map((id) => ({ id, exercise: exerciseRepository.get(subject, id) }))
        .map(({ id, exercise: { type, name, description } }) => ({
          id,
          type: type,
          name: name,
          description: description,
        }));

      ctx.response.body = { exercises };
    },
  });
  const addExercise = controller({
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

      if (!(await isAssigneeOf(subjectRepository.get(subject), user))) {
        throw new httpErrors["Forbidden"]();
      }

      exerciseRepository.add(subject, exerciseId, content);
    },
  });

  const getExercise = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { subject, exerciseId } }) => {
      const user = await authorize(ctx);

      if (!(await isAssigneeOf(subjectRepository.get(subject), user))) {
        throw new httpErrors["Forbidden"]();
      }

      const content = exerciseRepository.getContent(subject, exerciseId);

      ctx.response.body = { content };
    },
  });

  const updateExercise = controller({
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
      { body: { subject, exerciseId, content } }
    ) => {
      const user = await authorize(ctx);

      if (!(await isAssigneeOf(subjectRepository.get(subject), user))) {
        throw new httpErrors["Forbidden"]();
      }

      exerciseRepository.update(subject, exerciseId, content);
    },
  });

  const previewExercise = controller({
    schema: {
      body: {
        content: exerciseSchema.content,
        seed: userSchema.seedDefault,
      },
    },
    status: 200,
    handle: (ctx: RouterContext, { body: { content, seed } }) => {
      //! AP missing // TODO: is it ok???
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
    .post("/list", listExercise)
    .post("/add", addExercise)
    .post("/get", getExercise)
    .post("/update", updateExercise)
    .post("/preview", previewExercise);
}
