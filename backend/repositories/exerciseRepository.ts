// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { emptyDir, exists, join, parse, stringify, walk } from "../deps.ts";
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
  readonly _structure: Record<string, Section[]> = {}; // subject -> eid
  readonly unlisted: Record<string, string[]> = {}; // subject -> eid
  private readonly exercises: Record<string, [Exercise, boolean] | undefined> =
    {}; // uid -> [Exercise, inYaml]

  private exercisesPath!: string;

  readonly uid = (subject: string, exerciseId: string) =>
    `${subject}/${exerciseId}`;

  constructor(private config: ConfigService, private logger: Logger) {}

  async init() {
    this.exercisesPath = this.config.EXERCISES_PATH;

    const ex = walk(this.exercisesPath, { includeFiles: false, maxDepth: 1 });
    ex.next(); //replace slice(1) with using first result

    for await (const { path, name: subject } of ex) {
      try {
        const index = join(path, "index.yml");
        if (!exists(index)) {
          continue;
        }

        this.unlisted[subject] = [];
        for await (const { name: file } of walk(
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

          await this.appendExerciseFile(subject, match[1]);
        }

        const content = await Deno.readTextFile(index).then(parse);

        if (!isArrayOf(isYAMLSection, content)) {
          throw new Error("index not a YAMLSection[]");
        }

        this._structure[subject] = this.buildSectionList(subject, content);
      } catch (e) {
        this.logger.recogniseAndTrace(e, { msg: `${subject}` });
      }
    }

    for (const uid in this.exercises) {
      if (this.exercises[uid]![1]) {
        continue;
      }

      const match = uid.match(/(.+)\/(.+)/);

      if (match === null || match.length < 3) {
        throw new Error("never");
      }

      const [subject, eid] = match.slice(1, 3);
      this.unlisted[subject].push(eid);
    }
  }

  drop() {
    return emptyDir(this.exercisesPath);
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

  private async appendExerciseFile(
    subject: string,
    exerciseId: string,
    content?: string
  ) {
    const uid = this.uid(subject, exerciseId);

    try {
      const exercise = this.parse(
        content ?? (await this.getContent(subject, exerciseId))
      );

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
        const ex = this.getOrFail(subject, el);

        if (ex?.type === "ExerciseNotFound") {
          // TODO
          // exercise exists in yaml but file doesn't exist
          continue;
        }

        structure.push({ name: ex.name, children: el }); // TODO: name should not be stored
        this.exercises[this.uid(subject, el)]![1] = true;
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
      .filter((e) => e.startsWith(prefix))
      .map((e) => e.slice(prefix.length));
  }

  listSubjects() {
    return Object.keys(this.unlisted);
  }

  async structureSet(subject: string, value: Section[]) {
    const index = joinThrowable(this.exercisesPath, subject, "index.yml");
    const makeYAMLSection = (section: Section[]): (YAMLSection | string)[] =>
      section.flatMap<YAMLSection | string>((x) => {
        if (!isSubSection(x)) {
          const exerciseId = x.children;
          const uid = this.uid(subject, exerciseId);

          if (!(uid in this.exercises)) {
            return [];
          }

          if (!this.exercises[uid]![1]) {
            this.exercises[uid]![1] = true;
            this.unlisted[subject] = this.unlisted[subject].filter(
              (x) => x !== exerciseId
            );
          }

          return exerciseId;
        }

        return {
          [x.name]: makeYAMLSection(x.children),
        };
      });

    await Deno.writeTextFile(index, stringify(makeYAMLSection(value)));
    this._structure[subject] = value;
  }

  add(subject: string, exerciseId: string, content: string) {
    if (this.uid(subject, exerciseId) in this.exercises) {
      throw new CustomDictError("ExerciseAlreadyExists", {
        subject,
        exerciseId,
      });
    }

    return this.update(subject, exerciseId, content);
  }

  get(subject: string, exerciseId: string) {
    return this.exercises[this.uid(subject, exerciseId)]?.[0];
  }
  getOrFail(subject: string, exerciseId: string) {
    const exercise = this.get(subject, exerciseId);

    if (!exercise) {
      throw new CustomDictError("ExerciseNotFound", { subject, exerciseId });
    }

    return exercise;
  }

  async update(subject: string, exerciseId: string, content: string) {
    const path = join(this.exercisesPath, subject, exerciseId) + ".txt";
    await this.appendExerciseFile(subject, exerciseId, content);

    await Deno.writeTextFile(path, content);
  }

  getContent(subject: string, exerciseId: string) {
    const uid = this.uid(subject, exerciseId);
    const path = join(this.exercisesPath, `${uid}.txt`);

    return Deno.readTextFile(path).catch(() => {
      throw new CustomDictError("ExerciseNotFound", { subject, exerciseId });
    });
  }

  getStaticContentPath(subject: string) {
    return joinThrowable(this.exercisesPath, subject, "static");
  }
}
