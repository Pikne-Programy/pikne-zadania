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

export type ReportType = { [uid: string]: { [eid: string]: null | number } };

// TODO (Marwyk): Fix old records having undefined properties (session, reports) due to a new database version
export type SessionType = {
  isFinished: boolean;
  exercises: string[];
  report: ReportType;
};

export type TeamType = {
  id: number;
  name: string;
  assignee: string;
  members: string[];
  invitation?: string;
  session: SessionType;
  reports: string[];
};

export type SubjectType = {
  id: string;
  assignees: string[] | null;
};
