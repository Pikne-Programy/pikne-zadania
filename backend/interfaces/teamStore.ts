// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Team, User } from "../models/mod.ts";

export interface ITeamStore {
  list(): Promise<Team[]>;
  add(
    id: number | null,
    options: { name: string; assignee: User },
  ): Promise<0 | 1 | 2>;
  get(id: number): Promise<Team | null>;
  delete(id: number): Promise<void>; // throws
  invitation: {
    create(id: number): string;
    get(inv: string): number | null;
  };
}
