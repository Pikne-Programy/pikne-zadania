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
import { CustomDictError, Exercise } from "../common/mod.ts";
import {
  joinThrowable,
  isSubSection,
  Section,
  isArrayOf,
  isJSONType,
  isObjectOf,
} from "../utils/mod.ts";
import { ConfigService, Logger } from "../services/mod.ts";
import exts from "../exts/mod.ts";

type YAMLSection =
  | {
      // we assume that there is only one key, feel free to tell TypeScript that
      [key: string]: YAMLSection[];
    }
  | string;
const isYAMLSection = (what: unknown): what is YAMLSection =>
  typeof what === "string" ||
  (isObjectOf((x): x is YAMLSection[] => isArrayOf(isYAMLSection, x), what) &&
    Object.keys(what).length == 1);

export class ExerciseRepository {
  private readonly _structure: { [key: string]: Section[] } = {}; // subject -> eid
  private readonly _unlisted: { [key: string]: string[] } = {}; // subject -> eid
  private readonly exercises: {
    [key: string]: [Exercise, boolean]; // uid -> [Exercise, inYaml]
  } = {};

  private readonly exercisesPath;

  readonly uid = (subject: string, exerciseId: string) =>
    `${subject}/${exerciseId}`;

  constructor(private config: ConfigService, private logger: Logger) {
    this.exercisesPath = this.config.EXERCISES_PATH;

    for (const { path, name: subject } of [
      ...walkSync(this.exercisesPath, { includeFiles: false, maxDepth: 1 }),
    ].slice(1)) {
      try {
        const index = join(path, "index.yml");
        if (!existsSync(index)) continue;
        this._unlisted[subject] = [];
        for (const { name: file } of walkSync(
          join(this.exercisesPath, subject),
          {
            includeDirs: false,
            maxDepth: 1,
            exts: [".txt"],
          }
        )) {
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
        this.logger.recogniseAndTrace(e, { msg: `${subject}` });
      }
    }

    for (const uid in this.exercises) {
      if (this.exercises[uid][1]) {
        continue;
      }

      const match = uid.match(/(.+)\/(.+)/);

      if (match === null || match.length < 3) {
        throw new Error("never");
      }

      const [subject, eid] = match.slice(1, 3);
      this._unlisted[subject].push(eid);
    }
  }

  drop() {
    emptyDirSync(this.exercisesPath);
  }

  parse(content: string) {
    const re = /^---$/gm;
    let occur;
    // find 2nd occurrence of `---`
    if (!re.exec(content) || !(occur = re.exec(content))) {
      throw new CustomDictError("ExerciseBadFormat", {
        description: "the header is necessary",
      });
    }

    const properties = parse(content.substring(0, occur.index));

    if (!isObjectOf(isJSONType, properties)) {
      throw new CustomDictError("ExerciseBadFormat", { description: "never" });
    }
    const { type, name, ...props } = properties;
    const exercise = content.substring(re.lastIndex);

    if (typeof type !== "string" || typeof name !== "string") {
      throw new CustomDictError("ExerciseBadFormat", {
        description: "type and name are necessary",
      });
    }
    if (!(type in exts)) {
      throw new CustomDictError("ExerciseBadFormat", {
        description: "unknown type",
      });
    }

    try {
      return new exts[type](this.config, name, exercise, props); // it can throw an error
    } catch (e) {
      throw new CustomDictError("ExerciseBadFormat", {
        description: `${e instanceof Error ? e.message : e}`,
      });
    }
  }

  private appendExerciseFile(
    subject: string,
    exerciseId: string,
    content: string = this.getContent(subject, exerciseId)
  ) {
    const uid = this.uid(subject, exerciseId);

    try {
      const exercise = this.parse(content);

      this.exercises[uid] = [exercise, false];

      return exercise;
    } catch (e) {
      this.logger.recogniseAndTrace(e, {
        msg: `exercise ${uid}`,
      });
    }
  }
  private buildSectionList(
    subject: string,
    elements: (YAMLSection | string)[]
  ) {
    const structure: Section[] = [];

    for (const el of elements) {
      if (typeof el === "string") {
        const ex = this.get(subject, el);

        if (ex?.type === "ExerciseNotFound") {
          // TODO
          // exercise exists in yaml but file doesn't exist
          continue;
        }

        structure.push({ name: ex.name, children: el }); // TODO: name should not be stored (add it dynamically in controller?)
        this.exercises[this.uid(subject, el)][1] = true;
      } else {
        const name = Object.keys(el)[0];
        const children = this.buildSectionList(subject, el[name]);

        structure.push({ name, children });
      }
    }

    return structure;
  }

  listExercises(subject: string) {
    if (!this.listSubjects().includes(subject)) {
      throw new CustomDictError("SubjectNotFound", { subject });
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
    get: () => this._structure[subject] ?? null, //FIXME ?? null xd?
    set: (value: Section[]) => {
      const index = joinThrowable(this.exercisesPath, subject, "index.yml");
      const makeYAMLSection = (section: Section[]): (YAMLSection | string)[] =>
        section.flatMap<YAMLSection | string>((x) => {
          if (!isSubSection(x)) {
            const exerciseId = x.children;
            const uid = this.uid(subject, exerciseId);

            if (!(uid in this.exercises)) {
              return [];
            }

            if (!this.exercises[uid][1]) {
              this.exercises[uid][1] = true;
              this._unlisted[subject] = this._unlisted[subject].filter(
                (x) => x !== exerciseId
              );
            }

            return exerciseId;
          }

          return {
            [x.name]: makeYAMLSection(x.children),
          };
        });

      Deno.writeTextFileSync(index, stringify(makeYAMLSection(value)));
      this._structure[subject] = value;
    },
  });

  readonly unlisted = (subject: string) => ({
    get: () => this._unlisted[subject],
  });

  add(subject: string, exerciseId: string, content: string) {
    const uid = this.uid(subject, exerciseId);

    return uid in this.exercises
      ? new CustomDictError("ExerciseAlreadyExists", {
          subject,
          exerciseId,
        })
      : this.update(subject, exerciseId, content);
  }

  get(subject: string, exerciseId: string) {
    const exercise = this.exercises[this.uid(subject, exerciseId)];

    if (exercise === undefined) {
      throw new CustomDictError("ExerciseNotFound", { subject, exerciseId });
    }

    return exercise[0];
  }

  update(subject: string, exerciseId: string, content: string) {
    const path = join(this.exercisesPath, subject, exerciseId) + ".txt";
    this.appendExerciseFile(subject, exerciseId, content);

    Deno.writeTextFileSync(path, content);
  }

  getContent(subject: string, exerciseId: string) {
    const uid = this.uid(subject, exerciseId);
    const path = join(this.exercisesPath, `${uid}.txt`);

    try {
      return Deno.readTextFileSync(path);
    } catch {
      throw new CustomDictError("ExerciseNotFound", { subject, exerciseId });
    }
  }

  getStaticContentPath(subject: string) {
    return joinThrowable(this.exercisesPath, subject, "static");
  }
}
