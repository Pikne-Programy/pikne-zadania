// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  basename,
  existsSync,
  httpErrors,
  join,
  parse,
  RouterContext,
  send,
  walkSync,
} from "../deps.ts";
import { exists, joinThrowable } from "../utils/mod.ts";
import exts from "../exts/mod.ts";
import { Exercise, isArrayOf, isJSONType, isObjectOf } from "../types/mod.ts";

interface section {
  name: string;
  children: section[] | string;
}
interface YAMLSection {
  // we assume that there is only one key, feel free to tell TypeScript that
  [key: string]: (YAMLSection | string)[];
}
function isYAMLSection(what: unknown): what is YAMLSection {
  const isYAMLSectionOrString = (x: unknown): x is (YAMLSection | string) =>
    typeof x === "string" || isYAMLSection(x);
  const isArrayOfYAMLSectionOrString = (
    e: unknown,
  ): e is (YAMLSection | string)[] => isArrayOf(isYAMLSectionOrString, e);
  return isObjectOf(isArrayOfYAMLSectionOrString, what) &&
    Object.keys(what).length == 1;
}

const dict: { [key: string]: Exercise } = {}; // subject/id
const _list: section[] = [];
const exercisesPath = "./exercises";

function analyzeExFile(file: string): Exercise {
  const re = /^---$/gm;
  let occur;
  // find 2nd occurrence of `---`
  if (re.exec(file) && (occur = re.exec(file))) {
    const properties = parse(file.substring(0, occur.index));
    if (!isObjectOf(isJSONType, properties)) throw new Error("never");
    const { type, name } = properties;
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
  if (uid in dict) return dict[uid];
  try {
    const path = join(exercisesPath, `${uid}.txt`);
    const file = Deno.readTextFileSync(path);
    return dict[uid] = analyzeExFile(file);
  } catch (e) {
    console.error(`ERROR (exercise ${uid}): ${e}`);
    return null;
  }
}
function buildExerciseSection(subject: string, id: string): section | null {
  const ex = getExercise(subject, id);
  return ex ? { name: ex.name, children: id } : null;
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
      const section = buildExerciseSection(subject, el);
      if (section !== null) r.push(section);
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
      const content = parse(Deno.readTextFileSync(index));
      if (isArrayOf(isYAMLSection, content)) {
        const section = { name: subject, children: build(subject, content) };
        _list.push(section);
      } else throw new Error("index not a YAMLSection[]");
    }
  } catch (e) {
    console.error(`${subject}: ${e}`);
  }
}

export async function getStaticContent(ctx: RouterContext) {
  if (ctx.params.file && ctx.params.subject) {
    await send(ctx, ctx.params.file, {
      root: getStaticContentPath(ctx.params.subject),
    }); // there's a problem with no permission to element
  } else throw new Error("never");
}

export function list(ctx: RouterContext) {
  ctx.response.status = 200;
  ctx.response.body = _list;
}
export async function get(ctx: RouterContext) {
  if (ctx.params.id) {
    await exists(
      ctx,
      dict[`${ctx.params.subject}/${ctx.params.id}`],
      (ex) => {
        if (typeof ctx.state.seed === "number") {
          ctx.response.body = ex.render(ctx.state.seed);
        } else throw new Error("seed not a number");
      },
    );
  } else throw new httpErrors["BadRequest"]("params.id is necessary");
}
export async function check(ctx: RouterContext) {
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
  } else {
    throw new httpErrors["BadRequest"]("body and params.id are necessary");
  }
}
