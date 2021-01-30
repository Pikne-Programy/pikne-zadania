import { existsSync, parse, RouterContext, walkSync } from "../deps.ts";
import exts from "../exts/exts.ts";
import Exercise from "../exercise.ts";
import { JSONType, YAMLType } from "../types.ts";
interface section {
  name: string;
  children: section[] | string;
}

interface YAMLSection {
  // we assume that there is only one key, feel free to tell TypeScript that
  [key: string]: (YAMLSection | string)[];
}

export class ExercisesController {
  readonly dict: { [key: string]: Exercise } = {}; // subject/id
  readonly _list: section[] = [];

  static analyze(file: string): Exercise {
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

  static getCurrentFolder() {
    return Deno.cwd().split("/").slice(-1).pop() ?? "";
  }

  private getExercise(id: string): Exercise | null {
    const uid = `${ExercisesController.getCurrentFolder()}/${id}`;
    if (!(uid in this.dict)) {
      try {
        const file = Deno.readTextFileSync(`${id}.txt`);
        this.dict[uid] = ExercisesController.analyze(file);
      } catch (e) {
        console.error(
          `ERROR (exercise ${uid}):`,
          e,
        );
        return null;
      }
    }
    return this.dict[uid];
  }
  private buildExercise(id: string): section | null {
    if (this.getExercise(id) !== null) {
      return {
        name: this.getExercise(id)!.name,
        children: id,
      };
    } else {
      return null;
    }
  }
  private buildSection(section: YAMLSection): section {
    const name = Object.keys(section)[0];
    return {
      name,
      children: this._build(section[name]),
    };
  }
  private _build(elements: (YAMLSection | string)[]): section[] {
    const r: section[] = [];
    for (const el of elements) {
      if (typeof el === "string") {
        if (this.buildExercise(el) !== null) {
          r.push(this.buildExercise(el)!);
        }
      } else {
        r.push(this.buildSection(el));
      }
    }
    return r;
  }
  private build(elements: YAMLSection[]): section[] {
    return this._build(elements);
  }

  constructor() {
    const cwd = Deno.cwd();
    try {
      Deno.chdir("./exercises");
      for (
        const subject of [
          ...walkSync(".", { includeFiles: false, maxDepth: 1 }),
        ].slice(1)
      ) {
        Deno.chdir(`./${subject.name}`);
        try {
          if (existsSync("index.yml")) {
            const content: YAMLSection[] = <YAMLSection[]> parse(
              Deno.readTextFileSync("index.yml"),
            );
            this._list.push({
              name: ExercisesController.getCurrentFolder(),
              children: this.build(content),
            });
          }
        } catch (e) {
          console.error(`${ExercisesController.getCurrentFolder()}: ${e}`);
          Deno.chdir("..");
        }
      }
    } finally {
      Deno.chdir(cwd);
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
          this.dict[`${ctx.params.subject}/${ctx.params.id}`],
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
          this.dict[`${ctx.params.subject}/${ctx.params.id}`],
          async (ex) => {
            ctx.response.body = ex.check(ctx.state.seed, uanswer);
          },
        );
      } else throw new Error("body and params.id are necessary");
    });
  }
}
export default new ExercisesController();
