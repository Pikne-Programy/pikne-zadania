import { Router, RouterContext } from "../deps.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { ExerciseService } from "../services/mod.ts";
import { controller } from "../core/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";
import { Authorizer } from "./mod.ts";

@Injectable()
export class ExerciseController {
  constructor(
    private authorizer: Authorizer,
    private exerciseService: ExerciseService,
  ) {}

  findOne = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      ctx.response.body = await this.exerciseService.findOne(user, body);
    },
  });

  findAll = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx); //Unauthorized shouldn't see exercises not listed in hierarchy
      ctx.response.body = await this.exerciseService.findAll(user, body);
    },
  });

  create = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        content: exerciseSchema.content,
      },
    },
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      await this.exerciseService.create(user, body);
    },
  });

  update = controller({
    schema: {
      body: {
        subject: exerciseSchema.subject,
        exerciseId: exerciseSchema.id,
        content: exerciseSchema.content,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await this.authorizer.auth(ctx);
      await this.exerciseService.update(user, body);
    },
  });

  preview = controller({
    schema: {
      body: {
        content: exerciseSchema.content,
        seed: userSchema.seedDefault,
      },
    },
    status: 200,
    handle: (ctx: RouterContext, { body }) => {
      ctx.response.body = this.exerciseService.preview(body);
    },
  });

  router = new Router({
    prefix: "/subject/exercise",
  })
    .post("/get", this.findOne)
    .post("/list", this.findAll)
    .post("/add", this.create)
    .post("/update", this.update)
    .post("/preview", this.preview);
}
