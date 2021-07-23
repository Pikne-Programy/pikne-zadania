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
  structure: {
    get(subject: string): Section[];
    set(subject: string, value: Section[]): void;
  };
  add(id: string, content: string): void;
  get(id: string): Exercise;
  update(id: string, content: string): void; // upsert
}
