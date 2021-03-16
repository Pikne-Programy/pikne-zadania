import {
  basename,
  common,
  existsSync,
  join,
  normalize,
  parse,
  RouterContext,
  send,
  walkSync,
} from "../deps.ts";
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
  readonly exercisesPath = "./exercises";

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

  private getExercise(subject: string, id: string): Exercise | null {
    const uid = `${subject}/${id}`;
    if (!(uid in this.dict)) {
      try {
        const file = Deno.readTextFileSync(
          join(this.exercisesPath, `${uid}.txt`),
        );
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
  private buildExercise(subject: string, id: string): section | null {
    if (this.getExercise(subject, id) !== null) {
      return {
        name: this.getExercise(subject, id)!.name,
        children: id,
      };
    } else {
      return null;
    }
  }
  private buildSection(subject: string, section: YAMLSection): section {
    const name = Object.keys(section)[0];
    return {
      name,
      children: this._build(subject, section[name]),
    };
  }
  private _build(
    subject: string,
    elements: (YAMLSection | string)[],
  ): section[] {
    const r: section[] = [];
    for (const el of elements) {
      if (typeof el === "string") {
        if (this.buildExercise(subject, el) !== null) {
          r.push(this.buildExercise(subject, el)!);
        }
      } else {
        r.push(this.buildSection(subject, el));
      }
    }
    return r;
  }
  private build(subject: string, elements: YAMLSection[]): section[] {
    return this._build(subject, elements);
  }

  static joinThrowable(base: string, ...path: string[]): string {
    if (path.length) {
      const requested = join(base, path[0]);
      const commonPath = common([join(base), requested]);
      if (normalize(commonPath) == normalize(base)) {
        return this.joinThrowable(requested, ...path.slice(1));
      }
      throw new Deno.errors.PermissionDenied(
        `${base}, ${requested}, ${commonPath}`,
      );
    } else {
      return base;
    }
  }
  /*static fileExists(path: string): boolean {
    try {
      const stat = Deno.statSync(path);
      return stat && stat.isFile;
    } catch (error) {
      if (error && error instanceof Deno.errors.NotFound) {
        return false;
      } else {
        throw error; // throwable
      }
    }
  }*/
  getStaticContentPath(subject: string) {
    return ExercisesController.joinThrowable(
      this.exercisesPath,
      subject,
      "static",
    );
  }

  async getStaticContent(ctx: RouterContext) {
    const path = this.getStaticContentPath(ctx.params.subject!);
    //console.log(ctx.request.url.pathname, ctx.params.file!, { root: path });
    //if(ExercisesController.fileExists(path))
    await send(ctx, ctx.params.file!, { root: path }); // there's a problem with no permission to element
  }

  constructor() {
    for (
      const { path } of [
        ...walkSync(this.exercisesPath, { includeFiles: false, maxDepth: 1 }),
      ].slice(1)
    ) {
      const subject = basename(path);
      try {
        const index = join(path, "index.yml");
        if (existsSync(index)) {
          const content: YAMLSection[] = <YAMLSection[]> parse(
            Deno.readTextFileSync(index),
          );
          this._list.push({
            name: subject,
            children: this.build(subject, content),
          });
        }
      } catch (e) {
        console.error(`${subject}: ${e}`);
      }
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
    // deno-lint-ignore require-await
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
          // deno-lint-ignore require-await
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
          // deno-lint-ignore require-await
          async (ex) => {
            ctx.response.body = ex.check(ctx.state.seed, uanswer);
          },
        );
      } else throw new Error("body and params.id are necessary");
    });
  }
}
export default new ExercisesController();
