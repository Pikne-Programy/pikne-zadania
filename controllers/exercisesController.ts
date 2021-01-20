import { parse, RouterContext, walkSync } from "../deps.ts";
import EquationExercise from "../exts/equationExercise.ts";
import { JSONType, YAMLType } from "../types.ts";

interface section {
  name: string;
  children: string | section;
}
export class ExercisesController {
  readonly dict = new Map<string, EquationExercise>();
  readonly _list: (string | section)[] = [];
  constructor() {
    for (const entry of walkSync("./exercises")) {
      const path = entry.path.substring(0, entry.path.length - 4);
      const _ext = entry.path.substring(entry.path.length - 4);
      try {
        if (_ext === ".txt") {
          const text = Deno.readTextFileSync(entry.path);
          const re = /^---\r?\n/gm;
          let occur;
          // find 2nd occurence of `---`
          if (re.exec(text) && (occur = re.exec(text))) {
            const content = text.substring(re.lastIndex);
            const tags = path.split("\\").reverse();
            const properties = <{ [key: string]: YAMLType }> (
              parse(text.substring(0, occur.index))
            );
            const id = tags.splice(0, 1)[0];
            if ("name" in properties && typeof properties.name == "string") {
              const obj: EquationExercise = new EquationExercise(
                properties.name,
                content,
                {},
              ); // can throw an error
              let el: section | string;
              el = id;
              for (const e of tags.slice(0, -1)) {
                const temp: section | string = el;
                el = { name: e, children: temp };
              }
              this.dict.set(id, obj);
              this._list.push(el);
            }
          } else {
            throw new Error("Second `---` not found.");
          }
        }
      } catch (e) {
        console.error(`ERROR (file ${path}):`, e);
      }
    }
  }
  list(ctx: RouterContext) {
    try {
      ctx.response.status = 200;
      ctx.response.body = this._list;
    } catch (error) {
      console.error(error);
      ctx.response.status = 500;
      ctx.response.body = {
        msg: error.toString(),
      };
    }
  }
  get(ctx: RouterContext) {
    const seed = 0; // TODO
    try {
      if (ctx.params.id) {
        const exercise = this.dict.get(ctx.params.id);
        if (exercise) {
          ctx.response.status = 200;
          ctx.response.body = exercise.render(seed);
        } else {
          ctx.response.status = 404;
        }
      }
    } catch (error) {
      console.error(error);
      ctx.response.status = 500;
      ctx.response.body = {
        msg: error.toString(),
      };
    }
  }
  async check(ctx: RouterContext) {
    const seed = 0; // TODO
    try {
      if (ctx.request.hasBody && ctx.params.id) {
        const uanswer: JSONType = await ctx.request.body({ type: "json" })
          .value;
        const exercise = this.dict.get(ctx.params.id);
        if (exercise) {
          ctx.response.status = 200;
          ctx.response.body = exercise.check(seed, uanswer);
        }
      }
    } catch (error) {
      console.error(error);
      ctx.response.status = 500;
      ctx.response.body = {
        msg: error.toString(),
      };
    }
  }
}
export default new ExercisesController();
