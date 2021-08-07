// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export type RoleType = "student" | "teacher" | "admin";

export type UserType = {
  id: string;
  login: string;
  name: string;
  dhPassword: string; // double hashed password
  team: number;
  tokens: string[];
  seed?: number;
  role: RoleType;
  number?: number;
  exercises: { [key: string]: number };
};

export type TeamType = {
  id: number;
  name: string;
  assignee: string;
  members: string[];
  invitation?: string;
};

export type SubjectType = {
  id: string;
  assignees: string[];
};
