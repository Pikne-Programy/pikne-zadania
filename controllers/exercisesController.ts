import { parse, RouterContext, walkSync } from "../deps.ts";
import exts from "../exts/exts.ts";
import Exercise from "../exercise.ts";
import { JSONType, YAMLType } from "../types.ts";

interface section {
  name: string;
  children: string | section;
}
export class ExercisesController {
  readonly dict: { [key: string]: Exercise } = {};
  readonly _list: (string | section)[] = [];

  static analyze(file: string) {
    const re = /^---$/gm;
    let occur;
    // find 2nd occurence of `---`
    if (re.exec(file) && (occur = re.exec(file))) {
      const properties = <{ [key: string]: YAMLType }> parse(
        file.substring(0, occur.index),
      ) ?? {};
      const { type, name } = properties as { type: string; name: string };
      delete properties.name, properties.type;
      const content = file.substring(re.lastIndex);
      if (typeof type == "string" && typeof name == "string") {
        if (type in exts) {
          return new exts[type](
            name,
            content,
            properties,
          ); // it can throw an error
        } else throw new Error("unknown type");
      } else throw new Error("type and name are necessary");
    } else throw new Error("the header is necessary");
  }

  constructor() {
    Deno.chdir("./exercises");
    try {
      for (
        const entry of walkSync(".", { includeDirs: false, match: [/.*.txt/] })
      ) {
        try {
          const tags = entry.path.slice(0, -4).split("/").reverse();
          const id = tags.splice(0, 1)[0];
          const file = Deno.readTextFileSync(entry.path); // a content of file
          const obj = ExercisesController.analyze(file);
          let el: section | string = id;
          for (const e of tags) {
            el = { name: e, children: el };
          }
          this.dict[id] = obj;
          this._list.push(el);
        } catch (e) {
          console.error(`ERROR (exercise file ${entry.path}):`, e);
        }
      }
    } finally {
      Deno.chdir("..");
    }
  }

  static async predictDeath(ctx: RouterContext, inner: () => Promise<void>) {
    try {
      await inner();
    } catch (e) {
      ctx.response.status = 500;
      ctx.response.body = { msg: e.message };
      console.error(e.message, e.stack);
    }
  }

  static async exists<T>(
    ctx: RouterContext,
    x: T,
    next: (x: T) => Promise<void>,
  ) {
    if (x) {
      ctx.response.status = 200;
      await next(x);
    } else {
      ctx.response.status = 404;
    }
  }

  async list(ctx: RouterContext) {
    await ExercisesController.predictDeath(ctx, async () => {
      ctx.response.status = 200;
      ctx.response.body = this._list;
    });
  }
  async get(ctx: RouterContext) {
    await ExercisesController.predictDeath(ctx, async () => {
      if (ctx.params.id) {
        await ExercisesController.exists(
          ctx,
          this.dict[ctx.params.id],
          async (ex) => {
            ctx.response.body = ex.render(ctx.state.seed ?? 0);
          },
        );
      } else throw new Error("params.id is necessary");
    });
  }
  async check(ctx: RouterContext) {
    await ExercisesController.predictDeath(ctx, async () => {
      if (ctx.request.hasBody && ctx.params.id) {
        const uanswer: JSONType = await ctx.request.body({ type: "json" })
          .value;
        await ExercisesController.exists(
          ctx,
          this.dict[ctx.params.id],
          async (ex) => {
            ctx.response.body = ex.check(ctx.state.seed, uanswer);
          },
        );
      } else throw new Error("body and params.id are necessary");
    });
  }
}
export default new ExercisesController();
