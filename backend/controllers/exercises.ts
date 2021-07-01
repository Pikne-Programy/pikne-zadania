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
  send,
  walkSync,
} from "../deps.ts";
import {
  deepCopy,
  followSchema,
  handleThrown,
  joinThrowable,
  RouterContext,
  User,
} from "../utils/mod.ts";
import { exerciseSchema } from "../types/mod.ts";
import exts from "../exts/mod.ts";
import {
  Exercise,
  isArrayOf,
  isJSONType,
  isObjectOf,
  UserType,
} from "../types/mod.ts";

type Section = {
  name: string;
  children: Section[] | string;
};
type DoneSection = Section & {
  done?: number | null;
};
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
const _list: Section[] = [];
const exercisesPath = "./exercises";

function analyzeExFile(file: string): Exercise {
  const re = /^---$/gm;
  let occur;
  // find 2nd occurrence of `---`
  if (!re.exec(file) || !(occur = re.exec(file))) {
    throw new Error("the header is necessary");
  }
  const properties = parse(file.substring(0, occur.index));
  if (!isObjectOf(isJSONType, properties)) throw new Error("never");
  const { type, name } = properties;
  delete properties.name, properties.type;
  const content = file.substring(re.lastIndex);
  if (typeof type !== "string" || typeof name !== "string") {
    throw new Error("type and name are necessary");
  }
  if (!(type in exts)) throw new Error("unknown type");
  return new exts[type](name, content, properties); // it can throw an error
}

function getExercise(subject: string, id: string): Exercise | null {
  const uid = `${subject}/${id}`;
  if (uid in dict) return dict[uid];
  try {
    const path = join(exercisesPath, `${uid}.txt`);
    const file = Deno.readTextFileSync(path);
    return dict[uid] = analyzeExFile(file);
  } catch (e) {
    handleThrown(e, `exercise ${uid}`);
    return null;
  }
}
function buildExerciseSection(subject: string, id: string): Section | null {
  const ex = getExercise(subject, id);
  return ex ? { name: ex.name, children: id } : null;
}
function buildSection(subject: string, section: YAMLSection): Section {
  const name = Object.keys(section)[0];
  const children = _build(subject, section[name]);
  return { name, children };
}
function _build(
  subject: string,
  elements: (YAMLSection | string)[],
): Section[] {
  const r: Section[] = [];
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
function build(subject: string, elements: YAMLSection[]): Section[] {
  return _build(subject, elements);
}

function _checkDoneStatus(user: UserType, id: string): number | null {
  return user.role.name === "student" ? user.role.exercises[id] ?? null : null;
}

function userProgress(arr: DoneSection[], user: UserType) {
  if (user && user.role.name === "student") {
    for (const e of arr) {
      if (typeof e.children === "string") {
        e.done = user.role.exercises[e.children] ?? null;
      } else userProgress(e.children, user);
    }
  }
}

export function getStaticContentPath(subject: string) {
  return joinThrowable(exercisesPath, subject, "static");
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
      if (!isArrayOf(isYAMLSection, content)) {
        throw new Error("index not a YAMLSection[]");
      }
      const section = { name: subject, children: build(subject, content) };
      _list.push(section);
    }
  } catch (e) {
    handleThrown(e, `${subject}`);
  }
}

export async function getStaticContent(ctx: RouterContext) {
  if (!ctx.params.file || !ctx.params.subject) {
    throw new Error("never");
  }
  await send(ctx, ctx.params.file, {
    root: getStaticContentPath(ctx.params.subject),
  }); // there's a problem with no permission to element
}

export function list(ctx: RouterContext) {
  const userList: DoneSection[] = deepCopy(_list);
  if (ctx.state.user) userProgress(userList, ctx.state.user);
  ctx.response.status = 200;
  ctx.response.body = userList;
}
export const get = followSchema({ id: exerciseSchema.id }, async (ctx, req) => {
  const ex = dict[req.id];
  if (!ex) throw new httpErrors["NotFound"]();
  const content = await Deno.readTextFile(`./exercises/${req.id}.txt`);

  ctx.response.status = 200;
  ctx.response.body = content;
});

export const update = followSchema({
  id: exerciseSchema.id,
  content: exerciseSchema.content,
}, async (ctx, req) => {
  await Deno.writeTextFile(`./exercises/${req.id}.txt`, req.content);
  ctx.response.status = 200;
});

export const check = followSchema({
  id: exerciseSchema.id,
  answers: exerciseSchema.answers,
}, async (ctx, req) => {
  const ex = dict[req.id];
  if (!ex) throw new httpErrors["NotFound"]();
  const res = ex.check(ctx.state.seed, req.answers);
  if (ctx.state.user) {
    type EmailPartial = Omit<UserType, "email"> & { email?: string } | null;
    const user: EmailPartial = await User.get(ctx.state.user.id);
    if (user && user.role.name === "student") {
      res.done = Math.max(res.done, user.role.exercises[req.id] ?? -Infinity);
      delete user.email;
      user.role.exercises[req.id] = res.done;
      await User.set(user);
    }
  }
  ctx.response.status = 200;
  ctx.response.body = res.answers;
});

export const preview = followSchema({
  content: exerciseSchema.content,
  seed: exerciseSchema.seed,
}, (ctx, req) => {
  //TODO: Render with correct answers
  const ex = analyzeExFile(req.content);
  ctx.response.body = ex.render(req.seed);
  ctx.response.status = 200;
});

export const renderExercise = followSchema({
  id: exerciseSchema.id,
  seed: exerciseSchema.seed,
}, (ctx, req) => {
  //TODO: Render with correct answers
  const ex = dict[req.id];
  if (!ex) throw new httpErrors["NotFound"]();
  ctx.response.body = ex.render(req.seed);
  ctx.response.status = 200;
});
