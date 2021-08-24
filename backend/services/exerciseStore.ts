// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  basename,
  emptyDirSync,
  existsSync,
  join,
  parse,
  walkSync,
} from "../deps.ts";
import { handleThrown, joinThrowable } from "../utils/mod.ts";
import {
  CustomDictError,
  Exercise,
  isArrayOf,
  isJSONType,
  isObjectOf,
  Section,
} from "../types/mod.ts";
import { IConfigService, IExerciseStore } from "../interfaces/mod.ts";
import exts from "../exts/mod.ts";

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
  private readonly dict: { [key: string]: Exercise | undefined } = {}; // subject/exerciseId
  private readonly _structure: { [key: string]: Section[] } = {};
  private readonly exercisesPath;

  private readonly uid = (subject: string, exerciseId: string) =>
    `${subject}/${exerciseId}`;

  constructor(
    private cfg: IConfigService,
  ) {
    this.exercisesPath = this.cfg.EXERCISES_PATH;
    if (this.cfg.FRESH) this.drop();
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
        if (this.cfg.VERBOSITY >= 1) handleThrown(e, `${subject}`);
      }
    }
  }

  drop() {
    emptyDirSync(this.exercisesPath);
  }

  parse(content: string) {
    try {
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
    } catch (e) {
      return new CustomDictError("ExerciseBadFormat", {
        description: `${e instanceof Error ? e.message : e}`,
      });
    }
  }

  private appendExerciseFile(subject: string, exerciseId: string) {
    const uid = this.uid(subject, exerciseId);
    const path = join(this.exercisesPath, `${uid}.txt`);
    try {
      const content = Deno.readTextFileSync(path);
      const ex = this.update(subject, exerciseId, content);
      if (ex instanceof Error) throw ex;
      return ex;
    } catch (e) {
      if (this.cfg.VERBOSITY >= 1) handleThrown(e, `exercise ${uid}`);
    }
  }

  private _buildSectionList(
    subject: string,
    elements: (YAMLSection | string)[],
  ) {
    const r: Section[] = [];
    for (const el of elements) {
      if (typeof el === "string") {
        let ex = this.get(subject, el);
        if (ex?.type === "ExerciseNotFound") {
          ex = this.appendExerciseFile(subject, el) ?? ex;
        }
        if (ex instanceof Error) continue; // error reported above
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

  add(subject: string, exerciseId: string, content: string) {
    const uid = this.uid(subject, exerciseId);
    if (uid in this.dict) {
      return new CustomDictError("ExerciseAlreadyExists", {
        subject,
        exerciseId,
      });
    }
    return this.update(subject, exerciseId, content);
  }

  get(subject: string, exerciseId: string) {
    return this.dict[this.uid(subject, exerciseId)] ??
      new CustomDictError("ExerciseNotFound", { subject, exerciseId });
  }

  update(subject: string, exerciseId: string, content: string) {
    const uid = this.uid(subject, exerciseId);
    const ex = this.parse(content);
    if (ex instanceof Exercise) this.dict[uid] = ex;
    return ex;
  }

  getStaticContentPath(subject: string) {
    return joinThrowable(this.exercisesPath, subject, "static");
  }
}
