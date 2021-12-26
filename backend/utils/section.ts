// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isObject } from "../utils/mod.ts";
import { User } from "../models/mod.ts";
import { ExerciseRepository } from "../repositories/mod.ts";

type SubSection = {
  name: string;
  children: Section[];
};
export type Section = SubSection | { children: string };

export const isSubSection = (what: Section): what is SubSection =>
  typeof what.children !== "string";

export function makeSection(
  what: unknown,
  errorCallback: () => never
): Section {
  if (!isObject(what)) {
    errorCallback();
  }
  if (!("children" in what)) {
    errorCallback();
  }
  if (typeof what.children === "string") {
    const { children } = what;
    return { children };
  }
  if (typeof what.name !== "string") {
    errorCallback();
  }
  const { name, children } = what;
  if (!Array.isArray(children)) {
    errorCallback();
  }
  return {
    name,
    children: children.map((e) => makeSection(e, errorCallback)),
  };
}

export const iterateSection = async (
  section: Section[],
  subject: string,
  raw: boolean,
  exerciseRepository: ExerciseRepository,
  user?: User
) => {
  const sectionArray: unknown[] = [];

  for (const el of section) {
    if (!isSubSection(el)) {
      try {
        const exercise = exerciseRepository.get(subject, el.children);
        sectionArray.push({
          name: exercise.name,
          children: el.children,
          type: raw ? undefined : exercise.type,
          description: raw ? undefined : exercise.description,
          done:
            raw || user === undefined
              ? undefined
              : (await user.exercises.get(
                  exerciseRepository.uid(subject, el.children)
                )) ?? null,
        });
      } catch {
        // we really need this comment
      }
    } else {
      sectionArray.push({
        name: el.name,
        children: await iterateSection(
          el.children,
          subject,
          raw,
          exerciseRepository,
          user
        ),
      });
    }
  }

  return sectionArray;
};
