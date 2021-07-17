// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { basename, existsSync, join, parse, walkSync } from "../deps.ts";
import {
  Exercise,
  isArrayOf,
  isJSONType,
  isObjectOf,
  JSONType,
} from "../types/mod.ts";
import { User } from "../models/mod.ts";
import { deepCopy, handleThrown, joinThrowable } from "../utils/mod.ts";
import {
  DoneSection,
  IExercises,
  isYAMLSection,
  IUserFactory,
  Section,
  YAMLSection,
} from "../interfaces/mod.ts";
import exts from "../exts/mod.ts";

export class Exercises implements IExercises {
  private readonly dict: { [key: string]: Exercise } = {}; // subject/id
  private readonly _list: Section[] = [];
  private readonly exercisesPath = "./exercises";

  constructor(
    private uf: IUserFactory,
  ) {
    for (
      const { path } of [
        ...walkSync(this.exercisesPath, { includeFiles: false, maxDepth: 1 }),
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
          const section = {
            name: subject,
            children: this.build(subject, content),
          };
          this._list.push(section);
        }
      } catch (e) {
        handleThrown(e, `${subject}`);
      }
    }
  }

  analyze(content: string) {
    const re = /^---$/gm;
    let occur;
    // find 2nd occurrence of `---`
    if (!re.exec(content) || !(occur = re.exec(content))) {
      throw new Error("the header is necessary");
    }
    const properties = parse(content.substring(0, occur.index));
    if (!isObjectOf(isJSONType, properties)) throw new Error("never");
    const { type, name } = properties;
    delete properties.name, properties.type;
    const exercise = content.substring(re.lastIndex);
    if (typeof type !== "string" || typeof name !== "string") {
      throw new Error("type and name are necessary");
    }
    if (!(type in exts)) throw new Error("unknown type");
    return new exts[type](name, exercise, properties); // it can throw an error
  }

  // TODO: isolate private methods to another service

  private getExercise(subject: string, id: string) {
    const uid = `${subject}/${id}`;
    if (uid in this.dict) return this.dict[uid];
    try {
      const path = join(this.exercisesPath, `${uid}.txt`);
      const content = Deno.readTextFileSync(path);
      return this.dict[uid] = this.analyze(content);
    } catch (e) {
      handleThrown(e, `exercise ${uid}`);
      return null;
    }
  }

  private buildExerciseSection(subject: string, id: string) {
    const ex = this.getExercise(subject, id);
    return ex ? { name: ex.name, children: id } : null;
  }

  private buildSection(subject: string, section: YAMLSection) {
    const name = Object.keys(section)[0];
    const children = this._build(subject, section[name]);
    return { name, children };
  }

  private _build(subject: string, elements: (YAMLSection | string)[]) {
    const r: Section[] = [];
    for (const el of elements) {
      if (typeof el === "string") {
        const section = this.buildExerciseSection(subject, el);
        if (section !== null) r.push(section);
      } else {
        r.push(this.buildSection(subject, el));
      }
    }
    return r;
  }

  private build(subject: string, elements: YAMLSection[]) {
    return this._build(subject, elements);
  }

  private userProgress(arr: DoneSection[], user: User) {
    if (user && user.role.name === "student") {
      for (const e of arr) {
        if (typeof e.children === "string") {
          e.done = user.role.exercises[e.children] ?? null; //TODO(nircek): subject/id
        } else this.userProgress(e.children, user);
      }
    }
  }

  getStaticContentPath(subject: string) {
    return joinThrowable(this.exercisesPath, subject, "static");
  }

  getListOf(user: User | null) {
    const userList: DoneSection[] = deepCopy(this._list);
    if (user) this.userProgress(userList, user);
    return userList;
  }

  check(id: string, answer: JSONType, user: User | { seed: number }) {
    const ex = this.dict[id];
    if (ex === undefined) return null;
    const res = ex.check(user.seed, answer);
    if (user instanceof User && user.role.name === "student") {
      res.done = Math.max(res.done, user.role.exercises[id] ?? -Infinity);
      user.role.exercises[id] = res.done;
    }
    return res.answer;
  }

  render(id: string, seed: number) {
    const ex = this.dict[id];
    if (ex === undefined) return null;
    return ex.render(seed);
  }
}
