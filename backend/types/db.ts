// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export type UserRole =
  | {
      name: "student";
      number: number | null;
      exercises: { [key: string]: number };
    }
  | {
      name: "teacher";
    }
  | {
      name: "admin";
    };

export type UserType = {
  id: string;
  email: string;
  name: string;
  dhpassword: string;
  team: number;
  tokens: string[];
  seed: number;
  role: UserRole;
};

export type TeamType = {
  id: number;
  name: string;
  assignee: string;
  members: string[];
  invitation: string | null;
};

export type GlobalType = {
  lastTid: number;
};

export type success = boolean;

export type IdPartial<T extends { id: unknown }> = Pick<T, "id"> & Partial<T>;
export type IdOmit<T extends { id: unknown }> = Omit<T, "id">;
export type IdOptional<T extends { id: unknown }> = Partial<Pick<T, "id">> &
  Omit<T, "id">;
export type IdRequired<T extends { id: unknown }> = Pick<T, "id"> & Partial<T>;
