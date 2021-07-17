// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "../deps.ts";
import { GlobalType, TeamType, UserType } from "../types/mod.ts";
import { ITeamFactory, IUserFactory } from "./mod.ts";

export interface IDatabase {
  users?: Collection<UserType>;
  teams?: Collection<TeamType>;
  global?: Collection<GlobalType>;
  promiseQueue: Promise<unknown>[];
  invitations: { [key: string]: number };
  closeDB(): void;
  init(team: ITeamFactory, user: IUserFactory): Promise<void>;
}
