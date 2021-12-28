import { RouterContext, Router } from "../deps.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { ExerciseService } from "../services/mod.ts";
import { IAuthorizer, controller } from "../core/mod.ts";

export function ExerciseController(
  authorize: IAuthorizer,
  exerciseService: ExerciseService
) {
  const findOne = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      ctx.response.body = await exerciseService.findOne(user, body);
    },
  });

  const findAll = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx); //Unauthorized shouldn't see exercises not listed in hierarchy
      ctx.response.body = await exerciseService.findAll(user, body);
    },
  });

  const create = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        content: exerciseSchema.content,
      },
    },
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      await exerciseService.create(user, body);
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
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      await exerciseService.update(user, body);
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
    handle: (ctx: RouterContext, { body }) => {
      ctx.response.body = exerciseService.preview(body);
    },
  });

  return new Router({
    prefix: "/subject/exercise",
  })
    .post("/get", findOne)
    .post("/list", findAll)
    .post("/add", create)
    .post("/update", update)
    .post("/preview", preview);
}
