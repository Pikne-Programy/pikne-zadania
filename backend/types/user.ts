// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export type User = {
  id: string;
  email: string;
  name: string;
  dhpassword: string;
  team: number;
  tokens: string[];
  seed: number;
  role: {
    name: "student";
    number: number | null;
    exercises: { [key: string]: number };
  } | {
    name: "teacher";
  } | {
    name: "admin";
  };
};

export type Team = {
  id: number;
  name: string;
  assignee: string;
  members: string[];
  invCode: string | null;
};

export type Global = {
  lastTid: number;
};

export type success = boolean;
