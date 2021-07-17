// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOptional, TeamType } from "../types/mod.ts";
import { Team } from "../models/team.ts";

export interface ITeamFactory {
  getAll(lock?: symbol): Promise<Team[]>;
  add(team: IdOptional<TeamType>, lock?: symbol): Promise<number | null>;
  delete(id: number, lock?: symbol): Promise<boolean>;
  get(id: number, lock?: symbol): Promise<Team | null>;
}
