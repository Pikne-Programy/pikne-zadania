// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "../deps.ts";
import { GlobalType, TeamType, UserType } from "../types/mod.ts";
import { ITeam, IUser } from "./mod.ts";

export interface IDatabase {
  users?: Collection<UserType>;
  teams?: Collection<TeamType>;
  global?: Collection<GlobalType>;
  closeDB(): void;
  init(team: ITeam, user: IUser): Promise<void>;
}
