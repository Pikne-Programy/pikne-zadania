import { Router, RouterContext } from "../deps.ts";
import { exerciseSchema, userSchema } from "../schemas/mod.ts";
import { ExerciseService } from "../services/mod.ts";
import { TokenAuthController } from "./auth/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class ExerciseController {
  constructor(
    private controller: TokenAuthController,
    private exerciseService: ExerciseService,
  ) {}

  findOne() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          exerciseId: exerciseSchema.id,
        },
      },
      auth: true,
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        ctx.response.body = await this.exerciseService.findOne(user, body);
      },
    });
  }

  findAll() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
        },
      },
      auth: true,
      status: 200,
      handle: async (ctx: RouterContext, { body, user }) => {
        //Unauthorized shouldn't see exercises not listed in hierarchy
        ctx.response.body = await this.exerciseService.findAll(user, body);
      },
    });
  }

  create() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          exerciseId: exerciseSchema.id,
          content: exerciseSchema.content,
        },
      },
      auth: true,
      handle: async (_: RouterContext, { body, user }) => {
        await this.exerciseService.create(user, body);
      },
    });
  }

  update() {
    return this.controller.route({
      schema: {
        body: {
          subject: exerciseSchema.subject,
          exerciseId: exerciseSchema.id,
          content: exerciseSchema.content,
        },
      },
      auth: true,
      status: 200,
      handle: async (_: RouterContext, { body, user }) => {
        await this.exerciseService.update(user, body);
      },
    });
  }

  preview() {
    return this.controller.route({
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
  }

  router = () =>
    new Router({
      prefix: "/subject/exercise",
    })
      .post("/get", this.findOne())
      .post("/list", this.findAll())
      .post("/add", this.create())
      .post("/update", this.update())
      .post("/preview", this.preview());
}
