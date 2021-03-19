import {
  basename,
  existsSync,
  join,
  parse,
  RouterContext,
  send,
  walkSync,
} from "../deps.ts";
import { exists, joinThrowable, predictDeath } from "../utils/mod.ts";
import exts from "../exts/exts.ts";
import { Exercise, JSONType } from "../types/mod.ts";
interface section {
  name: string;
  children: section[] | string;
}

interface YAMLSection {
  // we assume that there is only one key, feel free to tell TypeScript that
  [key: string]: (YAMLSection | string)[];
}

const dict: { [key: string]: Exercise } = {}; // subject/id
const _list: section[] = [];
const exercisesPath = "./exercises";

function analyzeExFile(file: string): Exercise {
  const re = /^---$/gm;
  let occur;
  // find 2nd occurrence of `---`
  if (re.exec(file) && (occur = re.exec(file))) {
    const properties = <{ [key: string]: JSONType }> parse( // TODO: type check
      file.substring(0, occur.index),
    ) ?? {};
    const { type, name } = properties as { type: string; name: string }; // TODO: type check
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

function getExercise(subject: string, id: string): Exercise | null {
  const uid = `${subject}/${id}`;
  if (!(uid in dict)) {
    try {
      const file = Deno.readTextFileSync(
        join(exercisesPath, `${uid}.txt`),
      );
      dict[uid] = analyzeExFile(file);
    } catch (e) {
      console.error(
        `ERROR (exercise ${uid}):`,
        e,
      );
      return null;
    }
  }
  return dict[uid];
}
function buildExerciseSection(subject: string, id: string): section | null {
  if (getExercise(subject, id) !== null) {
    return {
      name: getExercise(subject, id)!.name,
      children: id,
    };
  } else {
    return null;
  }
}
function buildSection(subject: string, section: YAMLSection): section {
  const name = Object.keys(section)[0];
  return {
    name,
    children: _build(subject, section[name]),
  };
}
function _build(
  subject: string,
  elements: (YAMLSection | string)[],
): section[] {
  const r: section[] = [];
  for (const el of elements) {
    if (typeof el === "string") {
      if (buildExerciseSection(subject, el) !== null) {
        r.push(buildExerciseSection(subject, el)!);
      }
    } else {
      r.push(buildSection(subject, el));
    }
  }
  return r;
}
function build(subject: string, elements: YAMLSection[]): section[] {
  return _build(subject, elements);
}

export function getStaticContentPath(subject: string) {
  return joinThrowable(
    exercisesPath,
    subject,
    "static",
  );
}

for (
  const { path } of [
    ...walkSync(exercisesPath, { includeFiles: false, maxDepth: 1 }),
  ].slice(1)
) {
  const subject = basename(path);
  try {
    const index = join(path, "index.yml");
    if (existsSync(index)) {
      const content: YAMLSection[] = <YAMLSection[]> parse( // TODO: type check
        Deno.readTextFileSync(index),
      );
      _list.push({
        name: subject,
        children: build(subject, content),
      });
    }
  } catch (e) {
    console.error(`${subject}: ${e}`);
  }
}

export async function getStaticContent(ctx: RouterContext) {
  await send(ctx, ctx.params.file!, {
    root: getStaticContentPath(ctx.params.subject!),
  }); // there's a problem with no permission to element
}

export async function list(ctx: RouterContext) {
  // deno-lint-ignore require-await
  await predictDeath(ctx, async () => {
    ctx.response.status = 200;
    ctx.response.body = _list;
  });
}
export async function get(ctx: RouterContext) {
  await predictDeath(ctx, async () => {
    if (ctx.params.id) {
      await exists(
        ctx,
        dict[`${ctx.params.subject}/${ctx.params.id}`],
        // deno-lint-ignore require-await
        async (ex) => {
          ctx.response.body = ex.render(ctx.state.seed ?? 0);
        },
      );
    } else throw new Error("params.id is necessary");
  });
}
export async function check(ctx: RouterContext) {
  await predictDeath(ctx, async () => {
    if (ctx.request.hasBody && ctx.params.id) {
      await exists(
        ctx,
        dict[`${ctx.params.subject}/${ctx.params.id}`],
        async (ex) => {
          ctx.response.body = ex.check(
            ctx.state.seed,
            await ctx.request.body({ type: "json" }).value,
          );
        },
      );
    } else throw new Error("body and params.id are necessary");
  });
}
