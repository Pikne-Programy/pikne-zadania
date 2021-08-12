// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { basename, existsSync, join, parse, walkSync } from "../deps.ts";
import { IConfigService, IExerciseStore } from "../interfaces/mod.ts";
import {
  Exercise,
  isArrayOf,
  isJSONType,
  isObjectOf,
  Section,
} from "../types/mod.ts";
import { handleThrown } from "../utils/utils.ts";
import exts from "../exts/mod.ts";
import { joinThrowable } from "../utils/mod.ts";

interface YAMLSection {
  // we assume that there is only one key, feel free to tell TypeScript that
  [key: string]: (YAMLSection | string)[];
}
function isYAMLSection(what: unknown): what is YAMLSection {
  return isObjectOf(
    (x): x is (YAMLSection | string)[] =>
      isArrayOf(
        (y: unknown): y is YAMLSection | string =>
          typeof y === "string" || isYAMLSection(y),
        x,
      ),
    what,
  ) && Object.keys(what).length == 1;
}

export class ExerciseStore implements IExerciseStore {
  // TODO: rework
  private readonly dict: { [key: string]: Exercise } = {}; // subject/id
  private readonly _structure: { [key: string]: Section[] } = {};
  private readonly exercisesPath = "./exercises/";

  private readonly uid = (subject: string, id: string) => `${subject}/${id}`;

  constructor(
    private cfg: IConfigService,
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
          this._structure[subject] = this.buildSectionList(subject, content);
        }
      } catch (e) {
        handleThrown(e, `${subject}`);
      }
    }
  }

  parse(content: string) {
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
    return new exts[type](this.cfg, name, exercise, properties); // it can throw an error
  }

  private appendExerciseFile(subject: string, id: string) {
    const uid = this.uid(subject, id);
    const path = join(this.exercisesPath, `${uid}.txt`);
    const content = Deno.readTextFileSync(path);
    try {
      return this.add(subject, id, content);
    } catch (e) {
      handleThrown(e, `exercise ${uid}`);
    }
    return null;
  }

  private _buildSectionList(
    subject: string,
    elements: (YAMLSection | string)[],
  ) {
    const r: Section[] = [];
    for (const el of elements) {
      if (typeof el === "string") {
        let ex = this.get(subject, el);
        if (ex === null) ex = this.appendExerciseFile(subject, el);
        if (!ex) continue; // error thrown above
        r.push({ name: ex.name, children: el });
      } else {
        const name = Object.keys(el)[0];
        const children = this._buildSectionList(subject, el[name]);
        r.push({ name, children });
      }
    }
    return r;
  }

  private buildSectionList(subject: string, elements: YAMLSection[]) {
    return this._buildSectionList(subject, elements);
  }

  listExercises(_subject: string) {
    return ["pociagi-dwa", "czerpak"]; // TODO
  }

  listSubjects() {
    return ["fizyka", "_fizyka"]; // TODO
  }

  readonly structure = (subject: string) => ({
    get: () => this._structure[subject] ?? null,
    set: (value: Section[]) => {
      this._structure[subject] = value;
    },
  });

  add(subject: string, id: string, content: string) {
    const uid = this.uid(subject, id);
    if (uid in this.dict) throw new Error(); // TODO: error message
    return this.update(subject, id, content);
  }

  get(subject: string, id: string): Exercise | null {
    return this.dict[this.uid(subject, id)] ?? null;
  }

  update(subject: string, id: string, content: string) {
    const uid = this.uid(subject, id);
    return (this.dict[uid] = this.parse(content));
  }

  getStaticContentPath(subject: string) {
    return joinThrowable(this.exercisesPath, subject, "static");
  }
}
