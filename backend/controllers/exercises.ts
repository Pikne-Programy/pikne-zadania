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
import { db, deepCopy, exists, joinThrowable } from "../utils/mod.ts";
import exts from "../exts/mod.ts";
import {
  Exercise,
  isArrayOf,
  isJSONType,
  isObjectOf,
  User,
} from "../types/mod.ts";

interface Section {
  name: string;
  children: Section[] | string;
}
interface DoneSection extends Section {
  done?: number | null;
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
const _list: Section[] = [];
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
function buildExerciseSection(subject: string, id: string): Section | null {
  const ex = getExercise(subject, id);
  return ex ? { name: ex.name, children: id } : null;
}
function buildSection(subject: string, section: YAMLSection): Section {
  const name = Object.keys(section)[0];
  return {
    name,
    children: _build(subject, section[name]),
  };
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

function checkDoneStatus(user: User, id: string): number | null {
  if (user.role.name !== "student") return null;
  return user.role.exercises[id] ?? null;
}

function userProgress(arr: DoneSection[], user: User) {
  if (user && user.role.name === "student") {
    for (const e of arr) {
      if (typeof e.children === "string") {
        e.done = user.role.exercises[e.children] ?? null;
      } else {
        userProgress(e.children, user);
      }
    }
  }
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
  const userList: DoneSection[] = deepCopy(_list);
  if (ctx.state.user) userProgress(userList, ctx.state.user);
  ctx.response.status = 200;
  ctx.response.body = userList;
}
export async function get(ctx: RouterContext) {
  if (ctx.params.id) {
    await exists(
      ctx,
      dict[`${ctx.params.subject}/${ctx.params.id}`],
      (ex) => {
        if (typeof ctx.state.seed === "number") {
          const exercise = ex.render(ctx.state.seed);
          if (
            ctx.state.user && ctx.params.id &&
            ctx.state.user.role.name === "student"
          ) {
            exercise.done = checkDoneStatus(ctx.state.user, ctx.params.id);
          }
          ctx.response.status = 200;
          ctx.response.body = exercise;
        } else throw new Error("seed is not a number");
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
        const res = ex.check(
          ctx.state.seed,
          await ctx.request.body({ type: "json" }).value,
        );
        if (ctx.state.user && ctx.params.id) {
          type EmailPartial = Omit<User, "email"> & { email?: string } | null;
          const user: EmailPartial = await db.getUser(ctx.state.user.id);
          const id = ctx.params.id;
          if (!user || user.role.name !== "student") {
            throw new httpErrors["Forbidden"]("User is not a student");
          }
          res.done = Math.max(res.done, user.role.exercises[id] ?? -Infinity);
          delete user.email;
          user.role.exercises[id] = res.done;
          await db.setUser(user);
        }
        ctx.response.status = 200;
        ctx.response.body = res.answers;
      },
    );
  } else {
    throw new httpErrors["BadRequest"]("body and params.id are necessary");
  }
}
