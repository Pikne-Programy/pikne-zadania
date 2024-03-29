// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError, Exercise, Section } from "../types/mod.ts";

export interface IExerciseStore {
  uid(subject: string, id: string): string;
  deuid(uid: string): { subject: string; exerciseId: string } | null;
  parse(content: string): Exercise | CustomDictError<"ExerciseBadFormat">;
  listExercises(subject: string): string[] | CustomDictError<"SubjectNotFound">;
  listSubjects(): string[];
  structure(subject: string): {
    get(): Section[];
    set(value: Section[]): CustomDictError<"ExerciseAlreadyExists"> | void;
  };
  unlisted(subject: string): {
    get: () => string[];
    set: (exercises: string[]) => void;
  };
  add(
    subject: string,
    id: string,
    content: string,
  ): CustomDictError<"ExerciseAlreadyExists" | "ExerciseBadFormat"> | void;
  get(
    subject: string,
    id: string,
  ): Exercise | CustomDictError<"ExerciseNotFound">;
  inYaml(
    subject: string,
    id: string,
  ): boolean | CustomDictError<"ExerciseNotFound">;
  update(subject: string, id: string, content: string): void; // upsert
  getContent(
    subject: string,
    id: string,
  ): string | CustomDictError<"ExerciseNotFound">;
  getStaticContentPath(subject: string): string;
}
