// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  emptyDirSync,
  existsSync,
  join,
  parse,
  stringify,
  walkSync,
} from "../deps.ts";
import { handleThrown, joinThrowable } from "../utils/mod.ts";
import {
  CustomDictError,
  Exercise,
  isArrayOf,
  isJSONType,
  isObjectOf,
  isSubSection,
  Section,
} from "../types/mod.ts";
import { IConfigService, IExerciseStore } from "../interfaces/mod.ts";
import exts from "../exts/mod.ts";

type YAMLSection = {
  // we assume that there is only one key, feel free to tell TypeScript that
  [key: string]: YAMLSection[];
} | string;
function isYAMLSection(what: unknown): what is YAMLSection {
  return typeof what === "string" ||
    isObjectOf(
        (x): x is YAMLSection[] => isArrayOf(isYAMLSection, x),
        what,
      ) && Object.keys(what).length == 1;
}

export class ExerciseStore implements IExerciseStore {
  private readonly _structure: { [key: string]: Section[] } = {}; // subject -> eid
  private readonly _unlisted: { [key: string]: string[] } = {}; // subject -> eid
  private readonly exercises: {
    [key: string]: [Exercise, boolean]; // uid -> [Exercise, inYaml]
  } = {};

  private readonly exercisesPath;

  readonly uid = (subject: string, exerciseId: string) =>
    `${subject}/${exerciseId}`;

  readonly deuid = (uid: string) => {
    const match = uid.match(/^([^/]*)\/([^/]*)$/);
    return match === null ? null : { subject: match[1], exerciseId: match[2] };
  };

  constructor(
    private cfg: IConfigService,
  ) {
    this.exercisesPath = this.cfg.EXERCISES_PATH;
    for (
      const { path, name: subject } of [
        ...walkSync(this.exercisesPath, { includeFiles: false, maxDepth: 1 }),
      ].slice(1)
    ) {
      try {
        const index = join(path, "index.yml");
        if (!existsSync(index)) continue;
        this._unlisted[subject] = [];
        for (
          const { name: file } of [
            ...walkSync(join(this.exercisesPath, subject), {
              includeDirs: false,
              maxDepth: 1,
              exts: [".txt"],
            }),
          ]
        ) {
          const match = file.match(/(.+)\.txt$/);
          if (match === null || match.length < 2) {
            throw new Error("never");
          }
          this.appendExerciseFile(subject, match[1]);
        }

        const content = parse(Deno.readTextFileSync(index));
        if (!isArrayOf(isYAMLSection, content)) {
          throw new Error("index not a YAMLSection[]");
        }
        this._structure[subject] = this.buildSectionList(subject, content);
      } catch (e) {
        if (this.cfg.VERBOSITY >= 1) handleThrown(e, `${subject}`);
      }
    }
    for (const uid in this.exercises) {
      if (this.exercises[uid][1] === false) {
        const match = uid.match(/(.+)\/(.+)/);
        if (match === null || match.length < 3) {
          throw new Error("never");
        }
        const [subject, eid] = match.slice(1, 3);
        this._unlisted[subject].push(eid);
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

  private appendExerciseFile(
    subject: string,
    exerciseId: string,
    _content?: string,
  ) {
    try {
      const content = _content ?? this.getContent(subject, exerciseId);
      if (content instanceof CustomDictError) throw content;
      const uid = this.uid(subject, exerciseId);
      const ex = this.parse(content);
      if (ex instanceof Exercise) {
        this.exercises[uid] = [ex, false];
      }
      if (ex instanceof Error) throw ex; // TODO
      return ex;
    } catch (e) {
      if (this.cfg.VERBOSITY >= 1) {
        handleThrown(e, `exercise ${this.uid(subject, exerciseId)}`);
      }
    }
  }
  private _buildSectionList(
    subject: string,
    elements: (YAMLSection | string)[],
  ) {
    const structure: Section[] = [];
    for (const el of elements) {
      if (typeof el === "string") {
        const ex = this.get(subject, el);
        if (ex?.type === "ExerciseNotFound") { // TODO
          // exercise exists in yaml but file doesn't exist
          continue;
        }
        structure.push({ name: ex.name, children: el }); // TODO: name should not be stored (add it dynamically in controller?)
        this.exercises[this.uid(subject, el)][1] = true;
      } else {
        const name = Object.keys(el)[0];
        const children = this._buildSectionList(subject, el[name]);
        structure.push({ name, children });
      }
    }
    return structure;
  }

  private buildSectionList(subject: string, elements: YAMLSection[]) {
    return this._buildSectionList(subject, elements);
  }

  listExercises(subject: string) {
    if (!this.listSubjects().includes(subject)) {
      return new CustomDictError("SubjectNotFound", { subject });
    }
    const prefix = `${subject}/`;
    return Object.keys(this.exercises)
      .filter((e) => e.startsWith(prefix)) // TODO: refactor
      .map((e) => e.slice(prefix.length));
  }

  listSubjects() {
    return Object.keys(this._unlisted);
  }

  readonly structure = (subject: string) => ({
    get: () => this._structure[subject] ?? null,
    set: (value: Section[]) => {
      const index = joinThrowable(this.exercisesPath, subject, "index.yml");
      const makeYAMLSection = (
        section: Section[],
      ): (YAMLSection | string)[] => {
        return section.flatMap<YAMLSection | string>((x) => {
          if (!isSubSection(x)) {
            const exerciseId = x.children;
            const uid = this.uid(subject, exerciseId);
            if (!(uid in this.exercises)) return [];
            if (!this.exercises[uid][1]) {
              this.exercises[uid][1] = true;
              this._unlisted[subject] = this._unlisted[subject].filter((x) =>
                x !== exerciseId
              );
            }
            return exerciseId;
          }
          return {
            [x.name]: makeYAMLSection(x.children),
          };
        });
      };
      Deno.writeTextFileSync(index, stringify(makeYAMLSection(value)));
      this._structure[subject] = value;
    },
  });

  readonly unlisted = (subject: string) => ({
    get: () => this._unlisted[subject],
    set: (exercises: string[]) => this._unlisted[subject] = exercises,
  });

  add(subject: string, exerciseId: string, content: string) {
    const uid = this.uid(subject, exerciseId);
    if (uid in this.exercises) {
      return new CustomDictError("ExerciseAlreadyExists", {
        subject,
        exerciseId,
      });
    }
    return this.update(subject, exerciseId, content);
  }

  get(subject: string, exerciseId: string) {
    const ex = this.exercises[this.uid(subject, exerciseId)];
    if (ex === undefined) {
      return new CustomDictError("ExerciseNotFound", { subject, exerciseId });
    }
    return ex[0];
  }

  inYaml(subject: string, exerciseId: string) {
    const ex = this.exercises[this.uid(subject, exerciseId)];
    if (ex === undefined) {
      return new CustomDictError("ExerciseNotFound", { subject, exerciseId });
    }
    return ex[1];
  }

  update(
    subject: string,
    exerciseId: string,
    content: string,
  ) {
    const path = join(this.exercisesPath, subject, exerciseId) + ".txt";
    const ex = this.appendExerciseFile(subject, exerciseId, content);
    if (ex instanceof CustomDictError) return ex;
    Deno.writeTextFileSync(path, content);
  }

  getContent(subject: string, exerciseId: string) {
    const uid = this.uid(subject, exerciseId);
    const path = join(this.exercisesPath, `${uid}.txt`);
    try {
      return Deno.readTextFileSync(path);
    } catch (_) {
      return new CustomDictError("ExerciseNotFound", { subject, exerciseId });
    }
  }

  getStaticContentPath(subject: string) {
    return joinThrowable(this.exercisesPath, subject, "static");
  }
}
