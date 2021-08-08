// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Exercise } from "../types/mod.ts";

export type Section = {
  name: string;
  children: Section[] | string; // id
};

export interface IExerciseStore {
  parse(content: string): Exercise;
  list(subject: string): string[];
  structure(subject: string): {
    get(): Section[];
    set(value: Section[]): void;
  };
  add(subject: string, id: string, content: string): void;
  get(subject: string, id: string): Exercise | null;
  update(subject: string, id: string, content: string): void; // upsert

  getStaticContentPath(subject: string): string; // TODO: get rid off
}
