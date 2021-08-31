// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError, Exercise, Section } from "../types/mod.ts";

export interface IExerciseStore {
  parse(content: string): Exercise | CustomDictError<"ExerciseBadFormat">;
  listExercises(subject: string): string[];
  listSubjects(): string[];
  structure(subject: string): {
    get(): Section[];
    set(value: Section[]): void;
  };
  add(subject: string, id: string, content: string): void;
  get(
    subject: string,
    id: string,
  ): Exercise | CustomDictError<"ExerciseNotFound">;
  inYaml(
    subject: string,
    id: string,
  ): boolean | CustomDictError<"ExerciseNotFound">;
  update(subject: string, id: string, content: string): void; // upsert
  getContent(subject: string, id: string): string;
  getStaticContentPath(subject: string): string;
}
